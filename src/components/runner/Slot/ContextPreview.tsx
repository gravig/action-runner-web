import type { JsContextEntry } from "../../../types/actions";

/**
 * Displays the context entries (injected variables / methods) exposed by a
 * shape. Shown in the filled slot header area whenever a shape declares
 * context — most notably GenericDataset actions.
 */
export function ContextPreview({ entries }: { entries: JsContextEntry[] }) {
  if (!entries.length) return null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
        Available in scope
      </span>
      <div className="flex flex-col gap-0.5">
        {entries.map((e) => (
          <div
            key={e.name}
            className="flex items-baseline gap-1.5 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1"
          >
            <span className="font-mono text-[11px] font-semibold text-indigo-300 shrink-0">
              {e.name}
            </span>
            <span className="text-[10px] text-slate-500 select-none">:</span>
            <span className="font-mono text-[10px] text-slate-400 truncate">
              {e.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
