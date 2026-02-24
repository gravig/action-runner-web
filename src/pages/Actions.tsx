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
import ShapeCard from "../components/runner/ShapeCard";
import { useGetActionShapesQuery } from "../services/actionsApi";
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
}: {
  rendererType: RendererType;
  shapes: ActionShape[];
  onEdit?: (shape: ActionShape) => void;
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
          className="flex items-center justify-center w-5 h-6 text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none"
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
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-1 @xl:grid-cols-2 @2xl:grid-cols-3 pl-6">
          {shapes.map((shape) => (
            <ShapeCard
              key={shape.type[0]}
              shape={shape}
              onEdit={onEdit ? () => onEdit(shape) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Actions page ─────────────────────────────────────────────────────────────

export function Actions() {
  const { data, error, isLoading } = useGetActionShapesQuery();
  const [savedOrder, setSavedOrder] = useLocalStorage<string[]>(
    "actions.groups.order",
  );
  const [editShape, setEditShape] = useState<ActionShape | null>(null);

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

  const groups = applyOrder(groupShapes(data), savedOrder);
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
    <div className="@container p-4 h-full glass-panel text-sm overflow-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-4">
            {groups.map(({ rendererType, shapes }) => (
              <GroupSection
                key={rendererType}
                rendererType={rendererType}
                shapes={shapes}
                onEdit={
                  rendererType === "CustomAction" ? setEditShape : undefined
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
