/**
 * LayoutManager + LayoutManager.Panel
 *
 * A drag-and-drop, resizable grid layout powered by react-grid-layout.
 * Layout is persisted to localStorage when a storageKey is provided.
 *
 * Usage:
 *   <LayoutManager editable={isEditing}>
 *     <LayoutManager.Panel id="chart-1" defaultW={1} defaultH={4}>
 *       <CandleChart ... />
 *     </LayoutManager.Panel>
 *     <LayoutManager.Panel id="chart-2">
 *       <BarChart ... />
 *     </LayoutManager.Panel>
 *   </LayoutManager>
 */

import "react-grid-layout/css/styles.css";

import React, { Children, isValidElement, useMemo, useState } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Layouts = any;

const ResponsiveGridLayout = WidthProvider(Responsive);

// ─── Panel ────────────────────────────────────────────────────────────────────

export interface PanelProps {
  id: string;
  /** Width in grid columns (default 1 out of `cols`). */
  defaultW?: number;
  /** Height in row-height units (default 4). */
  defaultH?: number;
  children: React.ReactNode;
}

/** Marker component — LayoutManager reads its props to build the grid layout. */
function Panel({ children }: PanelProps) {
  // Rendered content is lifted by LayoutManager; this component just passes through.
  return <>{children}</>;
}

Panel.displayName = "LayoutManager.Panel";

// ─── LayoutManager ────────────────────────────────────────────────────────────

export interface LayoutManagerProps {
  children: React.ReactNode;
  /**
   * When true, panels can be dragged and resized.
   * A resize/drag handle is shown on each card.
   */
  editable?: boolean;
  /** Number of columns at the `lg` breakpoint (≥1200px). Default 2. */
  cols?: number;
  /** Height of one row-unit in pixels. Default 80. */
  rowHeight?: number;
  /**
   * localStorage key to persist and restore the layout.
   * Both edit and view instances should share the same key.
   */
  storageKey?: string;
}

function LayoutManager({
  children,
  editable = false,
  cols = 2,
  rowHeight = 80,
  storageKey,
}: LayoutManagerProps) {
  // Extract Panel children with their props
  const panels = useMemo(() => {
    const result: Array<{
      id: string;
      defaultW: number;
      defaultH: number;
      node: React.ReactNode;
    }> = [];
    Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;
      // Accept direct Panel children and arrays/fragments
      const el = child as React.ReactElement<PanelProps>;
      if (
        el.type === Panel ||
        (el.type as { displayName?: string }).displayName ===
          "LayoutManager.Panel"
      ) {
        result.push({
          id: el.props.id,
          defaultW: el.props.defaultW ?? 1,
          defaultH: el.props.defaultH ?? 4,
          node: el.props.children,
        });
      }
    });
    return result;
  }, [children]);

  // Build an initial layout — pack panels left-to-right, wrapping at `cols`
  const initialLayouts = useMemo<Layouts>(() => {
    const lg: any[] = [];
    let col = 0;
    let row = 0;
    for (const p of panels) {
      const w = Math.min(p.defaultW, cols);
      if (col + w > cols) {
        col = 0;
        row += 1;
      }
      lg.push({ i: p.id, x: col, y: row, w, h: p.defaultH });
      col += w;
    }
    return {
      lg,
      md: lg.map((l) => ({ ...l })),
      sm: lg.map((l) => ({ ...l, x: 0, w: 1 })),
      xs: lg.map((l) => ({ ...l, x: 0, w: 1 })),
    };
  }, [panels, cols]);

  const [layouts, setLayouts] = useState<Layouts>(() => {
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) return JSON.parse(raw) as Layouts;
      } catch {
        // ignore corrupt storage
      }
    }
    return initialLayouts;
  });

  // When panels change (add/remove during editing), merge new ids into layout
  const mergedLayouts = useMemo<Layouts>(() => {
    const panelIds = new Set(panels.map((p) => p.id));
    const addMissing = (base: any[]): any[] => {
      const existing = new Set(base.map((l) => l.i));
      const additions: any[] = [];
      let maxY = base.reduce((m, l) => Math.max(m, l.y + l.h), 0);
      for (const p of panels) {
        if (!existing.has(p.id)) {
          const w = Math.min(p.defaultW, cols);
          additions.push({ i: p.id, x: 0, y: maxY, w, h: p.defaultH });
          maxY += p.defaultH;
        }
      }
      return [...base.filter((l) => panelIds.has(l.i)), ...additions];
    };
    return {
      lg: addMissing(layouts.lg ?? []),
      md: addMissing(layouts.md ?? []),
      sm: addMissing(layouts.sm ?? []),
      xs: addMissing(layouts.xs ?? []),
    };
  }, [panels, layouts, cols]);

  if (panels.length === 0) return null;

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={mergedLayouts}
      breakpoints={{ lg: 1200, md: 768, sm: 480, xs: 0 }}
      cols={{ lg: cols, md: cols, sm: 1, xs: 1 }}
      rowHeight={rowHeight}
      isDraggable={editable}
      isResizable={editable}
      draggableHandle=".lm-drag-handle"
      onLayoutChange={(_layout, all) => {
        setLayouts(all);
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(all));
          } catch {
            // ignore storage errors (e.g. private browsing quota)
          }
        }
      }}
      margin={[12, 12]}
      containerPadding={[0, 0]}
    >
      {panels.map((p) => (
        <div
          key={p.id}
          className="rounded-xl border border-white/10 bg-white/[0.03] flex flex-col"
        >
          {editable && (
            <div className="lm-drag-handle flex items-center gap-2 px-3 py-1.5 border-b border-white/8 cursor-grab active:cursor-grabbing select-none shrink-0">
              <svg
                className="w-3.5 h-3.5 text-slate-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="9" cy="7" r="1.5" />
                <circle cx="15" cy="7" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="17" r="1.5" />
                <circle cx="15" cy="17" r="1.5" />
              </svg>
              <span className="text-[9px] font-medium uppercase tracking-widest text-slate-700">
                {p.id}
              </span>
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-auto p-4">{p.node}</div>
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}

// ─── Compose ──────────────────────────────────────────────────────────────────

LayoutManager.Panel = Panel;

export { LayoutManager };
