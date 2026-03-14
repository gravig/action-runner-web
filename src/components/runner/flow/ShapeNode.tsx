import { useState } from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import { resolveRenderer, RENDERER_CONFIGS } from "../shapeRenderers";
import type { ActionShape } from "../../../types/actions";
import { typeArrayColor } from "./typeColors";
import { MonacoCodeEditor } from "../MonacoCodeEditor";

// ─── Grid constants (keep in sync with FlowEditor.tsx) ───────────────────────
const SIZE_GRID = 50;

export type ShapeNodeData = {
  shape: ActionShape;
  /** Current value — only used for literal (non-callable) nodes. */
  value?: string | number | boolean;
  onChange?: (value: string | number | boolean) => void;
  /** Remove this node (and its edges) from the canvas. */
  onRemove?: () => void;
  /** Unpack a custom action — replace it with its inner payload shape. */
  onUnpack?: () => void;
  /** Save the unpacked subtree back to the custom action definition. */
  onSave?: () => Promise<void>;
  /** Set when this node was unpacked from a custom action. */
  unpackedFrom?: ActionShape;
  /** Extra TS declarations injected into Monaco — built from ancestor context in the flow. */
  jsExtraDeclarations?: string;
  /** When true, the green __root__ handle is hidden (Start is already wired elsewhere). */
  hideRootHandle?: boolean;
};

const HEADER_H = 44;
const ROW_H = 26;

// ─── helpers ──────────────────────────────────────────────────────────────────

function isLiteralShape(shape: ActionShape) {
  return !shape.callable && shape.type.includes("Literal");
}

function defaultValue(shape: ActionShape): string | number | boolean {
  if (shape.type[0] === "Boolean") return false;
  if (shape.type[0] === "Number") return 0;
  return "";
}

// ─── ValueEditor ──────────────────────────────────────────────────────────────

function ValueEditor({
  shape,
  value,
  onChange,
  jsExtraDeclarations,
}: {
  shape: ActionShape;
  value: string | number | boolean | undefined;
  onChange?: (v: string | number | boolean) => void;
  jsExtraDeclarations?: string;
}) {
  const v = value ?? defaultValue(shape);

  if (shape.type[0] === "Boolean") {
    return (
      <div className="nopan flex items-center gap-2 px-3 py-2">
        <span className="text-[10px] text-slate-400 font-medium flex-1">
          value
        </span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => onChange?.(!v)}
          className={`relative w-9 h-5 rounded-full border transition-colors ${
            v
              ? "bg-teal-500/30 border-teal-500/60"
              : "bg-white/5 border-white/15"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
              v ? "translate-x-4 bg-teal-400" : "bg-slate-500"
            }`}
          />
        </button>
        <span className="text-[10px] font-mono text-slate-400 w-10 text-right">
          {v ? "true" : "false"}
        </span>
      </div>
    );
  }

  if (shape.type[0] === "Number") {
    return (
      <div className="nopan px-3 py-2">
        <input
          type="number"
          value={v as number}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => onChange?.(Number(e.target.value))}
          placeholder="0"
          className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-teal-500/50 focus:outline-none"
        />
      </div>
    );
  }

  // Javascript / Element literal — full Monaco editor
  if (shape.type.includes("Javascript")) {
    return (
      <div className="px-1 py-1 flex-1 min-h-0 flex flex-col">
        <MonacoCodeEditor
          height="100%"
          value={v as string}
          onChange={(val) => onChange?.(val)}
          extraDeclarations={jsExtraDeclarations}
          nopan
        />
      </div>
    );
  }

  // Plain String literal — simple textarea
  return (
    <div className="nopan px-3 py-2">
      <textarea
        value={v as string}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="value"
        rows={2}
        className="w-full resize-none rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-teal-500/50 focus:outline-none"
      />
    </div>
  );
}

// ─── ShapeNode ────────────────────────────────────────────────────────────────

function IconX() {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <line x1="2" y1="2" x2="12" y2="12" />
      <line x1="12" y1="2" x2="2" y2="12" />
    </svg>
  );
}

function IconUnpack() {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9,2 12,2 12,5" />
      <polyline points="5,12 2,12 2,9" />
      <line x1="12" y1="2" x2="7" y2="7" />
      <line x1="2" y1="12" x2="7" y2="7" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 2h8l2 2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2z" />
      <rect x="4" y="8" width="6" height="4" rx="0.5" />
      <rect x="4" y="2" width="5" height="3" rx="0.5" />
    </svg>
  );
}

export function ShapeNode({ data }: NodeProps) {
  const {
    shape,
    value,
    onChange,
    onRemove,
    onUnpack,
    onSave,
    unpackedFrom,
    jsExtraDeclarations,
    hideRootHandle,
  } = data as ShapeNodeData;
  const params = Array.isArray(shape.params) ? shape.params : [];
  const renderer = resolveRenderer(shape.type);
  const cfg = RENDERER_CONFIGS[renderer];
  const isLiteral = isLiteralShape(shape);

  const isMultilineJs = isLiteral && shape.type.includes("Javascript");
  const bodyH = isLiteral
    ? isMultilineJs
      ? 138 // 120px Monaco + 18px padding
      : 52
    : Math.max(params.length, 1) * ROW_H;
  const totalH = HEADER_H + bodyH + 10;
  const outColor = typeArrayColor(shape.type);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`rounded-xl border ${cfg.border} ${cfg.bg} shadow-xl shadow-black/40 flex flex-col`}
      style={{
        width: "100%",
        height: "100%",
        minHeight: totalH,
        position: "relative",
        boxSizing: "border-box",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Resize handle ──────────────────────────────────────────────── */}
      <NodeResizer
        isVisible={hovered}
        minWidth={180}
        minHeight={totalH}
        snapWidth={SIZE_GRID}
        snapHeight={SIZE_GRID}
        lineStyle={{ borderColor: "rgba(100,116,139,0.4)" }}
        handleStyle={{
          width: 10,
          height: 10,
          borderRadius: 3,
          background: "rgba(100,116,139,0.6)",
          borderColor: "rgba(148,163,184,0.4)",
        }}
      />

      {/* ── Root target handle (accepts connections from Start node) ── */}
      <Handle
        type="target"
        position={Position.Top}
        id="__root__"
        style={{
          top: 0,
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: hideRootHandle ? 0 : 12,
          height: hideRootHandle ? 0 : 12,
          background: "#86efac",
          borderColor: "#22c55e",
          borderWidth: hideRootHandle ? 0 : 2,
          borderRadius: "50%",
          cursor: hideRootHandle ? "default" : "crosshair",
          opacity: hideRootHandle ? 0 : 1,
          pointerEvents: hideRootHandle ? "none" : undefined,
        }}
      />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 border-b border-white/10"
        style={{ height: HEADER_H }}
      >
        <span
          className={`${cfg.iconColor(shape)} flex h-5 w-5 shrink-0 items-center justify-center`}
        >
          {cfg.icon(shape)}
        </span>
        <span className="text-[11px] font-semibold text-slate-100 truncate flex-1">
          {cfg.label(shape)}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${cfg.badge} shrink-0`}
        >
          {cfg.badgeText}
        </span>

        {/* ── Node action buttons ─────────────────────────────────── */}
        <div className="nopan flex items-center gap-0.5 ml-1 shrink-0">
          {unpackedFrom && onSave && (
            <button
              title={`Save back to "${unpackedFrom.type[0]}"`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                void onSave();
              }}
              className="flex h-5 w-5 items-center justify-center rounded text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-500/15 transition-colors"
            >
              <span className="w-3 h-3">
                <IconSave />
              </span>
            </button>
          )}
          {shape.payload && onUnpack && (
            <button
              title="Unpack — replace with inner action"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onUnpack();
              }}
              className="flex h-5 w-5 items-center justify-center rounded text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/15 transition-colors"
            >
              <span className="w-3 h-3">
                <IconUnpack />
              </span>
            </button>
          )}
          {onRemove && (
            <button
              title="Remove node"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="flex h-5 w-5 items-center justify-center rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
            >
              <span className="w-3 h-3">
                <IconX />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Body: ValueEditor (literal) or param handles (callable) ── */}
      {isLiteral ? (
        <ValueEditor
          shape={shape}
          value={value}
          onChange={onChange}
          jsExtraDeclarations={jsExtraDeclarations}
        />
      ) : params.length === 0 ? (
        <div style={{ height: ROW_H }} className="flex items-center px-3">
          <span className="text-[10px] text-slate-600 italic">no params</span>
        </div>
      ) : (
        params.map((param, i) => {
          const c = typeArrayColor(param.type);
          const handleT = HEADER_H + i * ROW_H + ROW_H / 2;
          return (
            <div
              key={param.name}
              style={{ height: ROW_H }}
              className="flex items-center px-3 gap-1.5"
            >
              {/* Coloured target handle */}
              <Handle
                type="target"
                position={Position.Left}
                id={param.name}
                style={{
                  top: handleT,
                  left: 0,
                  transform: "translate(-50%, -50%)",
                  width: 12,
                  height: 12,
                  background: c.fill,
                  borderColor: c.border,
                  borderWidth: 2,
                  borderRadius: "50%",
                  cursor: "crosshair",
                }}
              />

              {/* Param name */}
              <span className={`text-[10px] font-medium ${c.text} truncate`}>
                {param.name}
              </span>
              {param.required && (
                <span className="text-[8px] text-rose-400 font-bold leading-none">
                  *
                </span>
              )}

              {/* Accepted type tags */}
              <div className="ml-auto flex gap-0.5 items-center shrink-0">
                {param.type.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className={`rounded px-1 py-0.5 text-[7px] font-semibold ${c.text} ${c.bg}`}
                  >
                    {t.length > 9 ? t.slice(0, 8) + "…" : t}
                  </span>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* ── Output / source handle ──────────────────────────────────── */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          top: totalH / 2,
          right: 0,
          transform: "translate(50%, -50%)",
          width: 12,
          height: 12,
          background: outColor.fill,
          borderColor: outColor.border,
          borderWidth: 2,
          borderRadius: "50%",
          cursor: "crosshair",
        }}
      />
    </div>
  );
}
