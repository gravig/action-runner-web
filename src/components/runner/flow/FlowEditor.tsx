import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type NodeTypes,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ActionShape } from "../../../types/actions";
import { ShapeNode, type ShapeNodeData } from "./ShapeNode";
import { StartNode } from "./StartNode";
import { ElementsEvents } from "../../../modules/definitions/ElementsModule";
import {
  updateCustomActionFn,
  useActionShapes,
} from "../../../services/actionsApi";

// ─── Flow graph serialization ─────────────────────────────────────────────────

/** Recursively serialize the subgraph rooted at `nodeId`. */
function serializeNodeSubtree(
  nodes: Node[],
  edges: Edge[],
  nodeId: string,
): unknown {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  const { shape, value } = node.data as ShapeNodeData;
  if (!shape.callable && shape.type.includes("Literal")) {
    const v =
      value ??
      (shape.type[0] === "Boolean"
        ? false
        : shape.type[0] === "Number"
          ? 0
          : "");
    return { type: shape.type, value: v };
  }
  const inEdges = edges.filter((e) => e.target === nodeId);
  const params: Record<string, unknown> = {};
  for (const p of Array.isArray(shape.params) ? shape.params : []) {
    const edge = inEdges.find((e) => e.targetHandle === p.name);
    params[p.name] = edge
      ? serializeNodeSubtree(nodes, edges, edge.source)
      : null;
  }
  return { type: shape.type, params };
}

function serializeFlowGraph(nodes: Node[], edges: Edge[]): unknown | null {
  if (nodes.length === 0) return null;

  // Root = the shape node connected to the Start node's output handle.
  // Fall back to the node whose id never appears as an edge source when
  // no Start node is present or wired.
  const startNode = nodes.find((n) => n.type === "start");
  let rootId: string | undefined;
  if (startNode) {
    const startEdge = edges.find((e) => e.source === startNode.id);
    rootId = startEdge?.target;
  }
  if (!rootId) {
    const shapeNodes = nodes.filter((n) => n.type !== "start");
    const sourceIds = new Set(edges.map((e) => e.source));
    const roots = shapeNodes.filter((n) => !sourceIds.has(n.id));
    rootId =
      roots.length > 0 ? roots[0].id : shapeNodes[shapeNodes.length - 1]?.id;
  }
  if (!rootId) return null;

  return serializeNodeSubtree(nodes, edges, rootId);
}

// ─── JS context collector ────────────────────────────────────────────────────
// Walks from a JS literal node up the edge chain and accumulates the
// `context` and `declarations` from each ancestor ActionShape so Monaco
// receives up-to-date type hints.
function collectJsContext(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
): string {
  const lines: string[] = [];
  const visited = new Set<string>();

  function walk(id: string) {
    if (visited.has(id)) return;
    visited.add(id);

    // Find the edge leaving this node toward a callable parent
    // (skip the __root__ handle which goes to the Start node).
    const outEdge = edges.find(
      (e) => e.source === id && e.targetHandle !== "__root__",
    );
    if (!outEdge) return;

    const parent = nodes.find((n) => n.id === outEdge.target);
    if (!parent || parent.type !== "shape") return;
    const parentShape = (parent.data as ShapeNodeData).shape;

    // Shape-level context and declarations
    for (const entry of parentShape.context ?? []) {
      lines.push(`declare const ${entry.name}: ${entry.type};`);
    }
    for (const decl of parentShape.declarations ?? []) {
      lines.push(decl);
    }

    // Param-level context and declarations (more specific hints)
    const paramName = outEdge.targetHandle;
    if (paramName) {
      const param = (
        Array.isArray(parentShape.params) ? parentShape.params : []
      ).find((p) => p.name === paramName);
      if (param) {
        for (const entry of param.context ?? []) {
          lines.push(`declare const ${entry.name}: ${entry.type};`);
        }
        for (const decl of param.declarations ?? []) {
          lines.push(decl);
        }
      }
    }

    walk(parent.id);
  }

  walk(nodeId);
  return lines.join("\n");
}

// ─── Grid constants ─────────────────────────────────────────────────────────
// Positions snap to POSITION_GRID × POSITION_GRID pixels.
// Node sizes snap to SIZE_GRID × SIZE_GRID pixels.
const POSITION_GRID = 50;
const SIZE_GRID = 50;

// Static ID so the start node is never duplicated across re-renders.
const START_NODE_ID = "__start__";

function IconPlay({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

// ─── Node type registry ───────────────────────────────────────────────────────

const nodeTypes: NodeTypes = { shape: ShapeNode, start: StartNode };

// ─── FlowEditor ───────────────────────────────────────────────────────────────

interface FlowEditorProps {
  /** Called with the serialized payload when the user clicks Run. */
  onRun?: (payload: unknown) => void;
  /** When true the Run button shows a loading state. */
  isRunning?: boolean;
}

/**
 * Advanced editor view: a ReactFlow canvas where shapes from the API can be
 * added via the left palette and wired together via typed handles.
 */
export function FlowEditor({ onRun, isRunning }: FlowEditorProps = {}) {
  const { data: allShapes } = useActionShapes();

  // Keep a ref so unpackNode can read the latest shapes list without
  // being re-created on every shapes update.
  const shapesRef = useRef<ActionShape[]>([]);
  shapesRef.current = allShapes ?? [];

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([
    {
      id: START_NODE_ID,
      type: "start",
      position: { x: 40, y: 40 },
      data: {},
      deletable: false,
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Keep refs so async callbacks always read the latest snapshot.
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;
  // Edges to add once nodes have rendered (ReactFlow drops edges whose handles
  // don't exist yet, so we queue them and flush after the next nodes render).
  const pendingEdgesRef = useRef<Edge[]>([]);

  useEffect(() => {
    if (pendingEdgesRef.current.length === 0) return;
    const toAdd = pendingEdgesRef.current;
    pendingEdgesRef.current = [];
    setEdges((prev) => [...prev, ...toAdd]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);
  // ── Update a literal node's value ─────────────────────────────────────────
  const updateNodeValue = useCallback(
    (nodeId: string, value: string | number | boolean) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, value } } : n,
        ),
      );
    },
    [setNodes],
  );

  // ── Remove a node and all edges connected to it ───────────────────────────
  const removeNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    },
    [setNodes, setEdges],
  );

  // ── Save an unpacked node's subtree back to its custom action definition ──
  const saveNode = useCallback(
    async (
      id: string,
      originalShape: import("../../../types/actions").ActionShape,
    ) => {
      const payload = serializeNodeSubtree(
        nodesRef.current,
        edgesRef.current,
        id,
      );
      await updateCustomActionFn({
        actionName: originalShape.type[0],
        payload,
      });
    },
    [],
  );

  // ── Unpack a custom action node — replace it with its inner payload ───────
  // The `payload` on an ActionShape is the *serialized* graph (params as a
  // dict of bound values), NOT a proper ActionShape with ShapeParam[] params.
  // We resolve the real shape definition from the live shapes list so the
  // node shows all handle rows correctly, then spawn child literal nodes for
  // each pre-filled param value and wire them up.
  const unpackNode = useCallback(
    (id: string) => {
      // Read current state via refs so we can do everything synchronously
      // (avoids the ReactFlow edge-drop issue that arises with setTimeout).
      const nds = nodesRef.current;
      const node = nds.find((n) => n.id === id);
      if (!node) return;
      const { shape: originalShape } = node.data as ShapeNodeData;
      const rawPayload = originalShape.payload;
      if (!rawPayload) return;

      // Look up the canonical ActionShape by type[0] so params is a ShapeParam[].
      const innerTypeName = rawPayload.type?.[0];
      const resolvedShape: ActionShape =
        (innerTypeName
          ? shapesRef.current.find((s) => s.type[0] === innerTypeName)
          : undefined) ?? rawPayload;

      const inner: ActionShape = resolvedShape.payload
        ? resolvedShape
        : { ...resolvedShape, payload: (rawPayload as ActionShape).payload };

      const isLiteral = !inner.callable && inner.type.includes("Literal");
      const initialValue = isLiteral
        ? inner.type[0] === "Boolean"
          ? false
          : inner.type[0] === "Number"
            ? 0
            : ""
        : undefined;

      // Build child nodes + edges for each bound literal param value.
      const snap = (v: number, grid: number) => Math.round(v / grid) * grid;
      const rawParams =
        typeof rawPayload.params === "object" &&
        !Array.isArray(rawPayload.params) &&
        rawPayload.params !== null
          ? (rawPayload.params as Record<string, unknown>)
          : {};

      const newChildNodes: Node[] = [];
      const newEdges: Edge[] = [];

      const PRIMITIVES: ActionShape[] = [
        {
          type: ["Javascript", "String", "Literal", "Element"],
          callable: false,
        },
        { type: ["String", "Literal", "Element"], callable: false },
        { type: ["Number", "Literal", "Element"], callable: false },
        { type: ["Boolean", "Literal", "Element"], callable: false },
      ];

      let rowIndex = 0;
      for (const [paramName, rawValue] of Object.entries(rawParams)) {
        if (!rawValue || typeof rawValue !== "object") {
          rowIndex++;
          continue;
        }
        const rv = rawValue as {
          type?: string[];
          value?: unknown;
          params?: unknown;
        };
        if (!rv.type?.length || rv.params !== undefined) {
          rowIndex++;
          continue;
        }

        const childShape: ActionShape = PRIMITIVES.find(
          (s) => s.type[0] === rv.type![0],
        ) ?? { type: rv.type!, callable: false };

        const childId = `${id}-param-${paramName}`;
        const childX = snap(node.position.x - 300, POSITION_GRID);
        const childY = snap(
          node.position.y + rowIndex * (SIZE_GRID * 2),
          POSITION_GRID,
        );

        newChildNodes.push({
          id: childId,
          type: "shape",
          position: { x: childX, y: childY },
          style: {
            width: snap(228, SIZE_GRID),
            height: snap(44 + 52 + 10, SIZE_GRID),
          },
          data: {
            shape: childShape,
            value: rv.value as string | number | boolean,
            onChange: (v: string | number | boolean) =>
              updateNodeValue(childId, v),
            onRemove: () => removeNode(childId),
          } satisfies ShapeNodeData,
        });

        newEdges.push({
          id: `${childId}→${id}:${paramName}`,
          source: childId,
          sourceHandle: "output",
          target: id,
          targetHandle: paramName,
          type: "smoothstep",
          style: { stroke: "rgba(100,116,139,0.6)", strokeWidth: 1.5 },
        });

        rowIndex++;
      }

      // Update parent node + add child nodes; queue edges to be wired after
      // nodes have rendered (ReactFlow drops edges referencing unregistered handles).
      setNodes((prev) => [
        ...prev.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  shape: inner,
                  value: initialValue,
                  onChange: (v: string | number | boolean) =>
                    updateNodeValue(id, v),
                  onRemove: () => removeNode(id),
                  onUnpack: inner.payload ? () => unpackNode(id) : undefined,
                  onSave: () => saveNode(id, originalShape),
                  unpackedFrom: originalShape,
                } satisfies ShapeNodeData,
              }
            : n,
        ),
        ...newChildNodes,
      ]);

      if (newEdges.length > 0) {
        pendingEdgesRef.current = [...pendingEdgesRef.current, ...newEdges];
      }
    },
    [setNodes, updateNodeValue, removeNode, saveNode],
  );

  // ── Connection validation ──────────────────────────────────────────────────
  // - Start node → any shape node via the __root__ handle: always allowed.
  // - Shape → shape: source types must overlap with target param's accepted types.
  const isValidConnection = useCallback(
    (connection: Connection): boolean => {
      const src = nodes.find((n) => n.id === connection.source);
      const tgt = nodes.find((n) => n.id === connection.target);
      if (!src || !tgt) return false;

      // Start node can only connect to the __root__ handle of a shape node,
      // and only when it isn't already wired to another node.
      if (src.type === "start") {
        const alreadyWired = edges.some((e) => e.source === START_NODE_ID);
        return (
          !alreadyWired &&
          connection.targetHandle === "__root__" &&
          tgt.type === "shape"
        );
      }

      // Prevent connecting to the __root__ handle from a non-start node.
      if (connection.targetHandle === "__root__") return false;

      const srcShape = (src.data as ShapeNodeData).shape;
      const tgtShape = (tgt.data as ShapeNodeData).shape;
      const paramName = connection.targetHandle;
      if (!paramName) return false;

      const param = (
        Array.isArray(tgtShape.params) ? tgtShape.params : []
      ).find((p) => p.name === paramName);
      if (!param) return false;

      return param.type.some((t) => srcShape.type.includes(t));
    },
    [nodes],
  );

  // ── Edge creation ──────────────────────────────────────────────────────────
  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            style: { stroke: "rgba(100,116,139,0.6)", strokeWidth: 1.5 },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  // ── Adding a node from the palette ─────────────────────────────────────────
  const addNode = useCallback(
    (shape: ActionShape) => {
      const id = `${shape.type[0]}-${Date.now()}`;
      const isLiteral = !shape.callable && shape.type.includes("Literal");
      const initialValue = isLiteral
        ? shape.type[0] === "Boolean"
          ? false
          : shape.type[0] === "Number"
            ? 0
            : ""
        : undefined;
      const snap = (v: number, grid: number) => Math.round(v / grid) * grid;
      const isMultilineJs = isLiteral && shape.type.includes("Javascript");
      const bodyH = isLiteral
        ? isMultilineJs
          ? 138
          : 52
        : Math.max(Array.isArray(shape.params) ? shape.params.length : 0, 1) *
          26;
      const initialH = snap(44 + bodyH + 10, SIZE_GRID);
      const initialW = snap(228, SIZE_GRID);
      setNodes((nds) => [
        ...nds,
        {
          id,
          type: "shape",
          position: {
            x: snap(
              40 + (nds.length % 3) * 280 + Math.random() * 30,
              POSITION_GRID,
            ),
            y: snap(
              40 + Math.floor(nds.length / 3) * 200 + Math.random() * 30,
              POSITION_GRID,
            ),
          },
          style: { width: initialW, height: initialH },
          data: {
            shape,
            value: initialValue,
            onChange: (v: string | number | boolean) => updateNodeValue(id, v),
            onRemove: () => removeNode(id),
            onUnpack: shape.payload ? () => unpackNode(id) : undefined,
          } satisfies ShapeNodeData,
        },
      ]);
    },
    [setNodes, updateNodeValue, removeNode, unpackNode],
  );

  // ── Recompute JS context hints + hideRootHandle whenever edges change ───────
  useEffect(() => {
    // Which shape node (if any) is the start node currently wired to?
    const startEdge = edges.find((e) => e.source === START_NODE_ID);
    const startTargetId = startEdge?.target;

    setNodes((nds) =>
      nds.map((n) => {
        if (n.type !== "shape") return n;
        const data = n.data as ShapeNodeData;

        // Hide the root handle on every node that isn't the start target.
        const hideRootHandle =
          startTargetId !== undefined && n.id !== startTargetId;

        // Recompute JS context declarations.
        const jsExtraDeclarations = data.shape.type.includes("Javascript")
          ? collectJsContext(n.id, nds, edges)
          : data.jsExtraDeclarations;

        if (
          hideRootHandle === data.hideRootHandle &&
          jsExtraDeclarations === data.jsExtraDeclarations
        )
          return n;

        return { ...n, data: { ...data, hideRootHandle, jsExtraDeclarations } };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges]);

  // ── Subscribe to ElementsEvents so clicking + in the palette adds a node ──
  // Subscribing here also ensures subscriberCount > 0, which makes the palette
  // show the + button while this editor is mounted.
  useEffect(() => {
    const handler = (shape: ActionShape | undefined) => {
      if (shape) addNode(shape);
    };
    ElementsEvents.on("onSelectElement", handler);
    return () => ElementsEvents.off("onSelectElement", handler);
  }, [addNode]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full min-w-0 overflow-hidden"
      style={{ height: "100%" }}
    >
      {/* Run button overlay */}
      {onRun && nodes.filter((n) => n.type !== "start").length > 0 && (
        <button
          onClick={() => {
            const payload = serializeFlowGraph(nodes, edges);
            console.log("[FlowEditor] serialized payload:", payload);
            onRun(payload!);
          }}
          disabled={isRunning}
          className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-lg border border-lime-500/50 bg-lime-500/15 px-3 py-1.5 text-xs font-semibold text-lime-400 shadow-lg backdrop-blur-sm transition hover:border-lime-400/70 hover:bg-lime-500/25 hover:text-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconPlay className="w-3 h-3" />
          {isRunning ? "Running…" : "Run"}
        </button>
      )}

      {/* Empty canvas hint */}
      {nodes.filter((n) => n.type !== "start").length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <span className="text-sm font-medium text-slate-500">
            Empty canvas
          </span>
          <span className="text-xs text-slate-600">
            Open the&nbsp;
            <span className="text-slate-400 font-medium">Elements</span>
            &nbsp;panel and press&nbsp;
            <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-slate-400">
              +
            </kbd>
            &nbsp;on any shape to add it
          </span>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        snapToGrid
        snapGrid={[POSITION_GRID, POSITION_GRID]}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        style={{ background: "transparent" }}
        proOptions={{ hideAttribution: true }}
      >
        {/* Layered dot grid: large sparse grid + fine dense grid */}
        <Background
          id="bg-dots-coarse"
          variant={BackgroundVariant.Dots}
          gap={48}
          size={1.5}
          color="rgba(99,179,237,0.18)"
        />
        <Background
          id="bg-dots-fine"
          variant={BackgroundVariant.Dots}
          gap={16}
          size={0.8}
          color="rgba(255,255,255,0.06)"
        />
        <Controls
          style={{
            background: "rgba(15,23,42,0.85)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
          }}
        />
      </ReactFlow>
    </div>
  );
}
