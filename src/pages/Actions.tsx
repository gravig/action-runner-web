import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ShapeCard, { ShapeCardCompact } from "../components/runner/ShapeCard";
import { useActionShapes, useDeleteCustomAction } from "../services/actionsApi";
import { SaveCustomActionModal } from "../components/runner/SaveCustomActionModal";
import { deserializeSlot } from "../components/runner/Slot/helpers";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { PersistedStateKey } from "../config/persistedState";
import {
  resolveRenderer,
  RENDERER_TYPES,
  RENDERER_CONFIGS,
} from "../components/runner/shapeRenderers";
import type { RendererType } from "../components/runner/shapeRenderers";
import type { ActionShape } from "../types/actions";
import { useEvents } from "../context/EventsContext";
import { useSubscriberCount } from "../hooks/useObservable";
import { useWindowContext } from "../context/WindowContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupShapes(
  shapes: ActionShape[],
): { rendererType: RendererType; shapes: ActionShape[] }[] {
  const map = new Map<RendererType, ActionShape[]>();
  for (const shape of shapes) {
    const rt = resolveRenderer(shape.type);
    if (!map.has(rt)) map.set(rt, []);
    map.get(rt)!.push(shape);
  }
  return RENDERER_TYPES.map((rt) => ({
    rendererType: rt,
    shapes: map.get(rt) ?? [],
  })).filter((g) => g.shapes.length > 0);
}

/**
 * Merge the persisted order with the live group list:
 * - Keeps the saved order for known keys
 * - Appends any new keys that aren't in the saved order yet
 * - Drops keys that no longer exist
 */
function applyOrder(
  groups: { rendererType: RendererType; shapes: ActionShape[] }[],
  savedOrder: string[],
) {
  const available = new Map(groups.map((g) => [g.rendererType, g]));
  const ordered: typeof groups = [];

  for (const key of savedOrder) {
    const g = available.get(key as RendererType);
    if (g) {
      ordered.push(g);
      available.delete(key as RendererType);
    }
  }
  // Append groups that weren't in the saved order (newly added renderer types)
  for (const g of available.values()) ordered.push(g);

  return ordered;
}

// ─── DragHandle icon ──────────────────────────────────────────────────────────

function DragHandle(props: React.HTMLAttributes<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="5.5" cy="4" r="1.2" />
      <circle cx="5.5" cy="8" r="1.2" />
      <circle cx="5.5" cy="12" r="1.2" />
      <circle cx="10.5" cy="4" r="1.2" />
      <circle cx="10.5" cy="8" r="1.2" />
      <circle cx="10.5" cy="12" r="1.2" />
    </svg>
  );
}

// ─── GroupSection ─────────────────────────────────────────────────────────────

function GroupSection({
  rendererType,
  shapes,
  onEdit,
  onDelete,
  onSelectElement,
  compact,
}: {
  rendererType: RendererType;
  shapes: ActionShape[];
  onEdit?: (shape: ActionShape) => void;
  onDelete?: (shape: ActionShape) => void;
  onSelectElement?: (shape: ActionShape) => void;
  compact?: boolean;
}) {
  const storageKey = `actions.group.${rendererType}` as PersistedStateKey;
  const [open, setOpen] = useLocalStorage<boolean>(storageKey);
  const cfg = RENDERER_CONFIGS[rendererType];
  const dummyShape: ActionShape = { type: [], callable: false };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rendererType });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-0">
      {/* Group header */}
      <div className="flex items-center gap-1">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-5 h-6 transition-colors text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing shrink-0 touch-none"
          tabIndex={0}
          aria-label={`Drag to reorder ${cfg.badgeText}s`}
        >
          <DragHandle className="w-3.5 h-3.5" />
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-1 py-2 text-left group"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform text-slate-500 group-hover:text-slate-300 ${
              open ? "rotate-90" : ""
            }`}
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M4 2.5l4 3.5-4 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className={`shrink-0 [&>svg]:h-4 [&>svg]:w-4 ${cfg.iconColor(dummyShape)}`}
          >
            {cfg.icon(dummyShape)}
          </span>
          <span
            className={`text-[11px] font-bold uppercase tracking-widest ${cfg.iconColor(dummyShape)}`}
          >
            {cfg.badgeText}s
          </span>
          <span className="text-[10px] text-slate-600 font-normal">
            {shapes.length}
          </span>
        </button>
      </div>

      {/* Cards grid */}
      {open && (
        <div
          className={`grid grid-cols-1 gap-2 pl-6 ${compact ? "" : "@sm:grid-cols-1 @xl:grid-cols-2 @2xl:grid-cols-3 gap-3"}`}
        >
          {shapes.map((shape) => (
            <div key={shape.type[0]} className="relative group/card">
              {compact ? (
                <ShapeCardCompact shape={shape} />
              ) : (
                <ShapeCard
                  shape={shape}
                  onEdit={onEdit ? () => onEdit(shape) : undefined}
                  onDelete={onDelete ? () => onDelete(shape) : undefined}
                />
              )}
              {onSelectElement && (
                <button
                  onClick={() => onSelectElement(shape)}
                  title={`Add ${shape.type[0]} to canvas`}
                  className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center
                             rounded bg-teal-500/20 text-teal-400 opacity-0 transition-opacity
                             hover:bg-teal-500/40 hover:text-teal-200
                             group-hover/card:opacity-100"
                >
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-3 h-3"
                  >
                    <path strokeLinecap="round" d="M6 2v8M2 6h8" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Actions page ─────────────────────────────────────────────────────────────

export function Actions() {
  const { isPopup } = useWindowContext();
  const events = useEvents<{ onSelectElement: ActionShape }>();
  const hasObservers =
    useSubscriberCount(events.observable("onSelectElement")) > 0;
  const { data, error, isLoading } = useActionShapes();
  const [savedOrder, setSavedOrder] = useLocalStorage<string[]>(
    "actions.groups.order",
  );
  const [compact, setCompact] = useLocalStorage<boolean>("actions.compact");
  const [search, setSearch] = useState("");
  const [editShape, setEditShape] = useState<ActionShape | null>(null);
  const [deleteCustomAction] = useDeleteCustomAction();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        Loading action shapes...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-500">
        Failed to load action shapes.
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const groups = applyOrder(groupShapes(data), savedOrder)
    .map((g) => ({
      ...g,
      shapes: query
        ? g.shapes.filter((s) => s.type[0]?.toLowerCase().includes(query))
        : g.shapes,
    }))
    .filter((g) => g.shapes.length > 0);
  const ids = groups.map((g) => g.rendererType);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id as RendererType);
    const newIndex = ids.indexOf(over.id as RendererType);
    const reordered = arrayMove(ids, oldIndex, newIndex);
    setSavedOrder(reordered);
  }

  return (
    <div
      className={`@container text-sm overflow-auto ${
        isPopup ? "h-full w-full p-4" : "p-4 h-full glass-panel"
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <circle cx="6.5" cy="6.5" r="4" />
            <path d="M11 11l3 3" />
          </svg>
          <input
            type="text"
            placeholder="Search actions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-[12px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-teal-500/50 focus:bg-white/8 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute transition-colors -translate-y-1/2 right-2 top-1/2 text-slate-500 hover:text-slate-300"
            >
              <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
                <path
                  d="M2 2l8 8M10 2l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Compact toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
          <span className="text-[11px] text-slate-400">Compact</span>
          <button
            role="switch"
            aria-checked={!!compact}
            onClick={() => setCompact((v) => !v)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              compact ? "bg-teal-500" : "bg-white/10"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                compact ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </button>
        </label>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-4">
            {groups.length === 0 && query && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="text-sm text-slate-500">No actions match</span>
                <span className="text-xs text-slate-600">
                  &ldquo;{query}&rdquo;
                </span>
              </div>
            )}
            {groups.map(({ rendererType, shapes }) => (
              <GroupSection
                key={rendererType}
                rendererType={rendererType}
                shapes={shapes}
                compact={!!compact}
                onSelectElement={
                  hasObservers
                    ? (shape) => events.emit("onSelectElement", shape)
                    : undefined
                }
                onEdit={
                  !compact && rendererType === "CustomAction"
                    ? setEditShape
                    : undefined
                }
                onDelete={
                  !compact && rendererType === "CustomAction"
                    ? (shape) => {
                        if (
                          window.confirm(
                            `Delete custom action "${shape.type[0]}"? This cannot be undone.`,
                          )
                        ) {
                          deleteCustomAction(shape.type[0]);
                        }
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {editShape && data && (
        <SaveCustomActionModal
          shapes={data}
          initialPayload={deserializeSlot(editShape.payload, data)}
          initialData={{
            actionName: editShape.type[0],
            summary: editShape.summary,
            tags: editShape.tags,
          }}
          onClose={() => setEditShape(null)}
          onSaved={() => setEditShape(null)}
        />
      )}
    </div>
  );
}
