import { useState } from "react";
import type {
  ActionShape,
  JsContextEntry,
  ShapeParam,
} from "../../types/actions";
import { resolveRenderer, RENDERER_CONFIGS } from "./shapeRenderers";

// ─── Type syntax highlighter ─────────────────────────────────────────────────

const TS_KEYWORDS = new Set([
  "string",
  "number",
  "boolean",
  "void",
  "any",
  "unknown",
  "never",
  "null",
  "undefined",
  "object",
  "symbol",
  "bigint",
]);

function HighlightedType({ type }: { type: string }) {
  const tokens = type.split(
    /(\b(?:string|number|boolean|void|any|unknown|never|null|undefined|object|symbol|bigint)\b|=>|\|&|[<>(){}[\],])/g,
  );
  return (
    <>
      {tokens.map((tok, i) => {
        if (TS_KEYWORDS.has(tok))
          return (
            <span key={i} className="text-sky-400">
              {tok}
            </span>
          );
        if (tok === "=>")
          return (
            <span key={i} className="text-amber-400">
              {tok}
            </span>
          );
        if (tok === "|" || tok === "&")
          return (
            <span key={i} className="text-violet-400">
              {tok}
            </span>
          );
        if (/^[<>(){}[\],]$/.test(tok))
          return (
            <span key={i} className="text-slate-500">
              {tok}
            </span>
          );
        return (
          <span key={i} className="text-slate-300">
            {tok}
          </span>
        );
      })}
    </>
  );
}

// ─── Context entry row ────────────────────────────────────────────────────────

function ContextEntryRow({ entry }: { entry: JsContextEntry }) {
  const isFn =
    entry.type.includes("=>") || entry.type.trimStart().startsWith("(");
  return (
    <div className="flex items-start gap-2.5 px-3 py-1.5 border-b border-white/5 last:border-0">
      <span
        className={`shrink-0 w-6 text-center rounded text-[8px] font-bold uppercase tracking-wide mt-px px-0.5 py-px ${
          isFn
            ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
            : "bg-sky-500/15 text-sky-400 border border-sky-500/25"
        }`}
      >
        {isFn ? "fn" : "var"}
      </span>
      <span className="font-mono text-[11px] text-white shrink-0 leading-5">
        {entry.name}
      </span>
      <span className="font-mono text-[11px] text-slate-600 shrink-0 leading-5">
        :
      </span>
      <span className="font-mono text-[11px] leading-5 break-all">
        <HighlightedType type={entry.type} />
      </span>
    </div>
  );
}

// ─── Collapsible section header ───────────────────────────────────────────────

function SectionHeader({
  label,
  count,
  open,
  onToggle,
  collapsible = false,
}: {
  label: string;
  count?: number;
  open?: boolean;
  onToggle?: () => void;
  collapsible?: boolean;
}) {
  if (!collapsible) {
    return (
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
    );
  }
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors w-fit"
    >
      <svg
        className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`}
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
      {label}
      {count !== undefined && (
        <span className="ml-0.5 rounded-full bg-white/10 px-1.5 py-px text-[9px] text-slate-400">
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Param row ───────────────────────────────────────────────────────────────

function ParamRow({ param }: { param: ShapeParam }) {
  const typeName = param.type[0];
  return (
    <div className="flex items-center gap-2 px-2 py-1 border rounded-md bg-white/5 border-white/10">
      <span className="font-mono text-xs text-slate-200">{param.name}</span>
      <span className="ml-auto font-mono text-[10px] text-slate-400">
        {typeName}
      </span>
      {param.required ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-400">
          req
        </span>
      ) : (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          opt
        </span>
      )}
    </div>
  );
}

// ─── ShapeCardCompact ─────────────────────────────────────────────────────────

export function ShapeCardCompact({ shape }: { shape: ActionShape }) {
  const rendererType = resolveRenderer(shape.type);
  const cfg = RENDERER_CONFIGS[rendererType];

  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border ${cfg.border} ${cfg.bg} px-3 py-2`}
    >
      <span className={`shrink-0 ${cfg.iconColor(shape)}`}>
        {cfg.icon(shape)}
      </span>
      <span className="flex-1 text-xs font-medium text-white truncate">
        {cfg.label(shape)}
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        {shape.callable && (
          <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-white/10 text-slate-300 border border-white/15">
            callable
          </span>
        )}
        <span
          className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${cfg.badge}`}
        >
          {cfg.badgeText}
        </span>
      </div>
    </div>
  );
}

// ─── ShapeCard ────────────────────────────────────────────────────────────────

function ShapeCard({
  shape,
  className,
  onEdit,
}: {
  shape: ActionShape;
  className?: string;
  onEdit?: () => void;
}) {
  const rendererType = resolveRenderer(shape.type);
  const cfg = RENDERER_CONFIGS[rendererType];
  const [declOpen, setDeclOpen] = useState(false);

  return (
    <div
      className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 flex flex-col gap-3 ${className || ""}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={cfg.iconColor(shape)}>{cfg.icon(shape)}</span>
        <span className="text-sm font-semibold text-white">
          {cfg.label(shape)}
        </span>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {shape.callable && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-white/10 text-slate-300 border border-white/15">
              callable
            </span>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:border-violet-400/50 transition"
            >
              <svg
                className="w-2.5 h-2.5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5Z" />
              </svg>
              Edit
            </button>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.badge}`}
          >
            {cfg.badgeText}
          </span>
        </div>
      </div>

      {/* Type hierarchy */}
      <div className="flex flex-wrap gap-1">
        {shape.type.map((t, i) => (
          <span
            key={t}
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
              i === 0
                ? "bg-white/10 text-slate-200"
                : "bg-white/5 text-slate-500"
            }`}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Summary */}
      {shape.summary && (
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {shape.summary}
        </p>
      )}

      {/* Params */}
      {shape.params && shape.params.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Params
          </p>
          {shape.params.map((p) => (
            <ParamRow key={p.name} param={p} />
          ))}
        </div>
      )}

      {/* Context */}
      {shape.context && shape.context.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <SectionHeader label="Context" />
          <div className="flex flex-col overflow-hidden border rounded-md border-white/10 bg-black/30">
            {shape.context.map((entry) => (
              <ContextEntryRow key={entry.name} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {/* Declarations */}
      {shape.declarations && shape.declarations.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <SectionHeader
            label="Declarations"
            count={shape.declarations.length}
            collapsible
            open={declOpen}
            onToggle={() => setDeclOpen((v) => !v)}
          />
          {declOpen && (
            <div className="flex flex-col gap-1">
              {shape.declarations.map((decl, i) => (
                <pre
                  key={i}
                  className="overflow-x-auto rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-[10px] text-slate-300 whitespace-pre-wrap break-all"
                >
                  {decl}
                </pre>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {shape.tags && shape.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {shape.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2 py-0.5 text-[9px] font-medium bg-white/5 text-slate-400 border border-white/10"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default ShapeCard;
