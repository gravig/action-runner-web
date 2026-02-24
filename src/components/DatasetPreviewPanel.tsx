import { useState } from "react";
import { useGetDatasetQuery } from "../services/datasetsApi";

// ─── Primitive value renderer ─────────────────────────────────────────────────

function Primitive({ value }: { value: unknown }) {
  if (value === null || value === undefined)
    return <span className="italic text-slate-500">null</span>;
  if (typeof value === "boolean")
    return (
      <span className={value ? "text-emerald-400" : "text-rose-400"}>
        {String(value)}
      </span>
    );
  if (typeof value === "number")
    return <span className="font-mono text-amber-300">{value}</span>;
  if (typeof value === "string") {
    if (value.length === 0)
      return <span className="italic text-slate-500">""</span>;
    // Detect URLs
    if (/^https?:\/\//.test(value))
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-mono text-sky-400 underline underline-offset-2 hover:text-sky-300"
        >
          {value}
        </a>
      );
    return <span className="break-all font-mono text-sky-200">{value}</span>;
  }
  return <span className="text-slate-300">{String(value)}</span>;
}

// ─── Collapsible node ─────────────────────────────────────────────────────────

function Collapsible({
  label,
  count,
  children,
  defaultOpen = false,
}: {
  label: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-left text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition group"
      >
        <svg
          className={`w-3 h-3 shrink-0 text-slate-500 transition-transform group-hover:text-slate-300 ${open ? "rotate-90" : ""}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 5l8 7-8 7V5z" />
        </svg>
        <span>{label}</span>
        {count !== undefined && (
          <span className="rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] text-slate-500">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="pl-4 border-l border-white/10 mt-1">{children}</div>
      )}
    </div>
  );
}

// ─── Generic value node ───────────────────────────────────────────────────────

function ValueNode({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined || typeof value !== "object") {
    return <Primitive value={value} />;
  }

  if (Array.isArray(value)) {
    if (value.length === 0)
      return <span className="italic text-slate-500 text-xs">[ ]</span>;

    // Array of flat objects with homogeneous keys → inline table
    const allObjects =
      value.length > 0 &&
      value.every(
        (v) => v !== null && typeof v === "object" && !Array.isArray(v),
      );

    if (allObjects && depth === 0) {
      return <DataTable rows={value as Record<string, unknown>[]} />;
    }

    return (
      <Collapsible label={`Array`} count={value.length} defaultOpen={depth < 2}>
        <div className="flex flex-col gap-1.5 py-1">
          {value.map((item, i) => (
            <div key={i} className="flex gap-2 text-xs items-start">
              <span className="shrink-0 text-[10px] text-slate-600 font-mono w-5 text-right pt-px">
                {i}
              </span>
              <ValueNode value={item} depth={depth + 1} />
            </div>
          ))}
        </div>
      </Collapsible>
    );
  }

  // Plain object
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0)
    return <span className="italic text-slate-500 text-xs">{"{ }"}</span>;

  return (
    <Collapsible label="Object" count={entries.length} defaultOpen={depth < 2}>
      <ObjectFields obj={value as Record<string, unknown>} depth={depth + 1} />
    </Collapsible>
  );
}

// ─── Object key-value rows ────────────────────────────────────────────────────

function ObjectFields({
  obj,
  depth = 0,
}: {
  obj: Record<string, unknown>;
  depth?: number;
}) {
  const entries = Object.entries(obj);
  return (
    <div className="flex flex-col gap-1.5 py-1">
      {entries.map(([key, val]) => (
        <div key={key} className="flex gap-2 text-xs items-start">
          <span className="shrink-0 font-mono text-[11px] text-indigo-300 min-w-[6rem] max-w-[12rem] truncate pt-px">
            {key}
          </span>
          <span className="text-slate-500 shrink-0 pt-px">:</span>
          <ValueNode value={val} depth={depth} />
        </div>
      ))}
    </div>
  );
}

// ─── Table for array-of-objects ───────────────────────────────────────────────

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  const allKeys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));

  // Classify columns: primitive-only → table cell, otherwise inline nested
  const primitiveKeys = allKeys.filter((k) =>
    rows.every((r) => {
      const v = r[k];
      return v === null || v === undefined || typeof v !== "object";
    }),
  );
  const complexKeys = allKeys.filter((k) => !primitiveKeys.includes(k));

  return (
    <div className="flex flex-col gap-4">
      {/* Primitive columns in a scrollable table */}
      {primitiveKeys.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white/5 text-slate-400 uppercase tracking-wider text-[9px]">
                {primitiveKeys.map((k) => (
                  <th
                    key={k}
                    className="px-3 py-2 text-left font-semibold whitespace-nowrap border-b border-white/10"
                  >
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-t border-white/5 transition ${
                    i % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                  } hover:bg-indigo-500/5`}
                >
                  {primitiveKeys.map((k) => (
                    <td
                      key={k}
                      className="px-3 py-1.5 align-top whitespace-nowrap max-w-[20rem] truncate"
                    >
                      <Primitive value={row[k]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Complex keys rendered per-row below table */}
      {complexKeys.length > 0 && (
        <div className="flex flex-col gap-3">
          {complexKeys.map((k) => (
            <div key={k} className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {k}
              </span>
              <div className="flex flex-col gap-1.5 pl-2 border-l border-white/10">
                {rows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-start text-xs">
                    <span className="shrink-0 font-mono text-[10px] text-slate-600 w-5 text-right pt-px">
                      {i}
                    </span>
                    <ValueNode value={row[k]} depth={1} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Loading / error states ───────────────────────────────────────────────────

function IconDatabase({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v5c0 1.657 3.582 3 8 3s8-1.343 8-3V5" />
      <path d="M4 10v5c0 1.657 3.582 3 8 3s8-1.343 8-3v-5" />
    </svg>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function DatasetPreviewPanel({ datasetName }: { datasetName: string }) {
  const { data, isLoading, error } = useGetDatasetQuery(datasetName);

  const rowCount = Array.isArray(data) ? data.length : null;

  return (
    <div className="h-full glass-panel">
      <div className="h-full overflow-auto p-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-1.5 text-indigo-400">
            <IconDatabase className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{datasetName}</p>
            {rowCount !== null && (
              <p className="text-[10px] text-slate-500">
                {rowCount} {rowCount === 1 ? "record" : "records"}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading && (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            <span className="animate-pulse">Loading dataset…</span>
          </div>
        )}

        {error && (
          <div className="flex flex-1 items-center justify-center">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-400">
              Failed to load dataset data.
            </div>
          </div>
        )}

        {data !== undefined && !isLoading && !error && (
          <div className="min-w-0">
            <ValueNode value={data} depth={0} />
          </div>
        )}
      </div>
    </div>
  );
}
