import { useState } from "react";
import { useGetDatasetsQuery } from "../services/datasetsApi";
import type { Dataset, DatasetParam } from "../types/datasets";
import { useDatasetPreview } from "../context/DatasetPreviewContext";

// ─── Icons ────────────────────────────────────────────────────────────────────

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

function IconChevron({
  open,
  className,
}: {
  open: boolean;
  className?: string;
}) {
  return (
    <svg
      className={`transition-transform ${open ? "rotate-180" : ""} ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ─── Param type badge ─────────────────────────────────────────────────────────

function TypeChips({ types }: { types: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {types.map((t, i) => (
        <span
          key={t}
          className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
            i === 0 ? "bg-white/10 text-slate-200" : "bg-white/5 text-slate-500"
          }`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

// ─── Item schema table (ObjectLiteral declaration) ────────────────────────────

function DeclarationTable({
  declaration,
}: {
  declaration: Record<string, { type: string; description?: string }>;
}) {
  const entries = Object.entries(declaration);
  return (
    <div className="mt-1.5 rounded-lg border border-white/10 overflow-hidden">
      <table className="w-full text-[10px] font-mono">
        <thead>
          <tr className="tracking-widest uppercase bg-white/5 text-slate-500">
            <th className="px-2.5 py-1.5 text-left font-semibold">field</th>
            <th className="px-2.5 py-1.5 text-left font-semibold">type</th>
            <th className="px-2.5 py-1.5 text-left font-semibold">
              description
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, val]) => (
            <tr key={key} className="border-t border-white/5">
              <td className="px-2.5 py-1.5 text-sky-300">{key}</td>
              <td className="px-2.5 py-1.5 text-amber-300">{val.type}</td>
              <td className="px-2.5 py-1.5 text-slate-400">
                {val.description ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Param row ────────────────────────────────────────────────────────────────

function ParamRow({ param }: { param: DatasetParam }) {
  const isArray = param.type[0] === "Array";
  const hasDeclaration = isArray && param.items?.declaration;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-semibold text-slate-200">
          {param.name}
        </span>
        {param.required ? (
          <span className="text-[9px] font-bold uppercase tracking-wide text-rose-400">
            req
          </span>
        ) : (
          <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-600">
            opt
          </span>
        )}
        <div className="ml-auto">
          <TypeChips types={param.type} />
        </div>
      </div>

      {isArray && param.items && (
        <div className="pl-3 ml-2 border-l border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">items:</span>
            {param.items.name && (
              <span className="font-mono text-[10px] text-slate-300">
                {param.items.name}
              </span>
            )}
            <TypeChips types={param.items.type} />
          </div>
          {hasDeclaration && (
            <DeclarationTable declaration={param.items.declaration!} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Dataset card ─────────────────────────────────────────────────────────────

function IconEye({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function DatasetCard({ dataset }: { dataset: Dataset }) {
  const [open, setOpen] = useState(false);
  const paramCount = dataset.params?.length ?? 0;
  const openPreview = useDatasetPreview();

  return (
    <div className="flex flex-col overflow-hidden border rounded-xl border-indigo-500/30 bg-indigo-500/5">
      {/* Header */}
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-1.5 text-indigo-400">
            <IconDatabase className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-white">
              {dataset.name}
            </span>
            <div className="mt-1">
              <TypeChips types={dataset.type} />
            </div>
          </div>
          <button
            onClick={() => openPreview(dataset.name)}
            title="Preview dataset data"
            className="shrink-0 flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-300 transition hover:border-indigo-400/60 hover:bg-indigo-500/20 hover:text-indigo-200"
          >
            <IconEye className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>

        {dataset.summary && (
          <p className="text-xs leading-relaxed text-slate-400">
            {dataset.summary}
          </p>
        )}

        {dataset.tags && dataset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dataset.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Fields toggle */}
      {paramCount > 0 && (
        <>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 border-t border-white/10 bg-white/[0.02] px-4 py-2.5 text-left text-xs text-slate-400 transition hover:bg-white/[0.05] hover:text-slate-200"
          >
            <IconChevron open={open} className="h-3.5 w-3.5" />
            <span>
              {open ? "Hide" : "Show"} fields
              <span className="ml-1.5 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px]">
                {paramCount}
              </span>
            </span>
          </button>

          {open && (
            <div className="flex flex-col gap-2 p-4 border-t border-white/10">
              {dataset.params!.map((p) => (
                <ParamRow key={p.name} param={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Datasets() {
  const { data, isLoading, error } = useGetDatasetsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-400">
        Loading datasets…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-400">
        Failed to load datasets.
      </div>
    );
  }

  return (
    <div className="h-full glass-panel">
      <div className="h-full p-4 overflow-auto">
        <div className="flex items-center gap-3 mb-4">
          <IconDatabase className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-semibold text-white">Datasets</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
            {data.length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {data.map((ds) => (
            <DatasetCard key={ds.name} dataset={ds} />
          ))}
        </div>
      </div>
    </div>
  );
}
