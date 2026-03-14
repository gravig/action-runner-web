import { useMemo, useState } from "react";
import type { ActionShape } from "../../../types/actions";
import { resolveRenderer, RENDERER_CONFIGS } from "../shapeRenderers";
import { ShapeCardCompact } from "../ShapeCard";
import { useSubscriberCount } from "../../../hooks/useObservable";
import { ElementsEvents } from "../../../modules/definitions/ElementsModule";

// Stable reference — created once at module level so it never triggers
// an unnecessary useSyncExternalStore re-subscription.
const onSelectElementObs = ElementsEvents.observable("onSelectElement");

// ─── Group ordering – mirrors the screenshot panel order ──────────────────────

export const PALETTE_GROUPS = [
  "SequenceAction",
  "Action",
  "CustomAction",
  "Dataset",
  "GenericDataset",
  "Literal",
  "Element",
] as const;

export type PaletteGroup = (typeof PALETTE_GROUPS)[number];

// ─── Small shared icons ───────────────────────────────────────────────────────

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      viewBox="0 0 24 24"
    >
      <polyline
        strokeLinecap="round"
        strokeLinejoin="round"
        points="6 9 12 15 18 9"
      />
    </svg>
  );
}

// ─── Single palette item (ShapeCardCompact + add-button overlay) ──────────────

interface PaletteItemProps {
  shape: ActionShape;
}

function PaletteItem({ shape }: PaletteItemProps) {
  const rendererType = resolveRenderer(shape.type);
  const cfg = RENDERER_CONFIGS[rendererType];

  // Show the + button only when at least one external subscriber has registered.
  // This re-renders automatically when subscribe / unsubscribe is called on the
  // observable (via onSubscriptionChanged → useSyncExternalStore).
  const subscriberCount = useSubscriberCount(onSelectElementObs);

  function handleAdd() {
    ElementsEvents.emit("onSelectElement", shape);
  }

  return (
    <div className="group relative">
      {/* Reuse the same card that TypesDropdown uses */}
      <ShapeCardCompact shape={shape} />

      {/* + button – visible only while at least one listener is subscribed */}
      {subscriberCount > 0 && (
        <button
          onClick={handleAdd}
          title={`Add ${cfg.label(shape)}`}
          className="absolute right-2 top-1/2 -translate-y-1/2
                     flex h-5 w-5 items-center justify-center rounded-md
                     border border-white/10 bg-[#0c1220]/80 text-slate-400
                     opacity-0 group-hover:opacity-100 transition
                     hover:border-teal-500/50 hover:bg-teal-500/10 hover:text-teal-300"
        >
          <IconPlus className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─── Group header row ─────────────────────────────────────────────────────────

interface GroupHeaderProps {
  rType: PaletteGroup;
  count: number;
  open: boolean;
  onToggle: () => void;
}

function GroupHeader({ rType, count, open, onToggle }: GroupHeaderProps) {
  const cfg = RENDERER_CONFIGS[rType];
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition"
    >
      <span
        className={`${cfg.iconColor({ type: [rType] } as ActionShape)} w-3.5 h-3.5 shrink-0 flex items-center`}
      >
        {cfg.icon({ type: [rType] } as ActionShape)}
      </span>
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex-1 text-left">
        {rType}
      </span>
      <span className="text-[9px] text-slate-600 mr-1">{count}</span>
      <IconChevron open={open} />
    </button>
  );
}

// ─── Main palette panel ───────────────────────────────────────────────────────

interface ShapePaletteProps {
  shapes: ActionShape[];
}

export function ShapePalette({ shapes }: ShapePaletteProps) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<
    Partial<Record<PaletteGroup, boolean>>
  >({});

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q
      ? shapes.filter((s) => s.type[0].toLowerCase().includes(q))
      : shapes;
  }, [shapes, query]);

  const grouped = useMemo(() => {
    const map = new Map<PaletteGroup, ActionShape[]>();
    for (const g of PALETTE_GROUPS) map.set(g, []);
    for (const shape of filtered) {
      const r = resolveRenderer(shape.type) as PaletteGroup;
      const dest = map.has(r) ? r : "Element";
      map.get(dest)!.push(shape);
    }
    return map;
  }, [filtered]);

  function toggleGroup(g: PaletteGroup) {
    setCollapsed((c) => ({ ...c, [g]: !c[g] }));
  }

  return (
    <div className="flex flex-col w-56 shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
        <IconSearch className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shapes…"
          className="flex-1 min-w-0 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-slate-600 hover:text-slate-300 transition text-xs leading-none"
          >
            ✕
          </button>
        )}
      </div>

      {/* Grouped shape list */}
      <div className="flex-1 overflow-y-auto">
        {PALETTE_GROUPS.map((rType) => {
          const list = grouped.get(rType) ?? [];
          if (list.length === 0) return null;
          const open = collapsed[rType] !== true;
          return (
            <div key={rType} className="border-b border-white/5 last:border-0">
              <GroupHeader
                rType={rType}
                count={list.length}
                open={open}
                onToggle={() => toggleGroup(rType)}
              />
              {open && (
                <div className="flex flex-col gap-1 px-2 pb-2">
                  {list.map((shape) => (
                    <PaletteItem key={shape.type[0]} shape={shape} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-slate-600">
            No shapes match&nbsp;
            <span className="text-slate-400">"{query}"</span>
          </p>
        )}
      </div>
    </div>
  );
}
