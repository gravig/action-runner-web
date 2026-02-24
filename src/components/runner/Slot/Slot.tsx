import React, { useContext, useEffect, useRef, useState } from "react";
import type { ActionShape, JsContextEntry } from "../../../types/actions";
import type { SlotValue } from "../../../types/builder";
import MonacoEditor, { type Monaco } from "@monaco-editor/react";
import { resolveRenderer, RENDERER_CONFIGS } from "../shapeRenderers";
import { TypeContext, DeclarationContext } from "./slotContext";
import { TypeProvider, DeclarationProvider } from "./providers";
import { matchesAccepts, PRIMITIVE_SHAPES, initSlotValue } from "./helpers";
import { ShapeSelectDropdown } from "./ShapeSelectDropdown";
import { getEnhancer } from "./enhancers";
import { ContextPreview } from "./ContextPreview";

// ─── EnhancedSlotForm ─────────────────────────────────────────────────────────
// Looks up a registered enhancer for the current action type and wraps
// SlotForm with it, or renders SlotForm directly when none is registered.

function EnhancedSlotForm(props: {
  value: SlotValue;
  onChange: (v: SlotValue) => void;
  shapes: ActionShape[];
  depth: number;
}) {
  const enhancer = getEnhancer(props.value.shape.type[0]);
  const form = <SlotForm {...props} />;
  return enhancer
    ? React.createElement(enhancer, { value: props.value }, form)
    : form;
}

// ─── SlotForm ─────────────────────────────────────────────────────────────────
// Uses function declaration (hoisted) so it can reference Slot below.

function SlotForm({
  value,
  onChange,
  shapes,
  depth,
}: {
  value: SlotValue;
  onChange: (v: SlotValue) => void;
  shapes: ActionShape[];
  depth: number;
}) {
  const jsTypeContext = useContext(TypeContext);
  const jsDeclarationsContext = useContext(DeclarationContext);

  function handleEditorDidMount(_editor: unknown, monaco: Monaco) {
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      checkJs: true,
      noLib: true,
    });

    // Clear all default and previously registered libs so only our
    // system-defined declarations are available.
    monaco.languages.typescript.javascriptDefaults.setExtraLibs([]);

    const lines: string[] = [
      ...Object.values(jsDeclarationsContext),
      ...Object.entries(jsTypeContext).map(
        ([name, type]) => `declare const ${name}: ${type};`,
      ),
    ];

    if (lines.length > 0) {
      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        lines.join("\n"),
        "ts:filename/slot-types.d.ts",
      );
    }
  }

  if (value.type[0] === "Javascript") {
    return (
      <div className="w-full min-w-[320px] max-w-full">
        <MonacoEditor
          height="200px"
          defaultLanguage="javascript"
          onMount={handleEditorDidMount}
          value={typeof value.value === "string" ? value.value : ""}
          onChange={(val) => onChange({ ...value, value: val ?? "" })}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    );
  }

  if (
    value.type[0] === "String" ||
    (value.type[0] !== "Boolean" && !value.params)
  ) {
    return (
      <input
        type={value.type[0] === "Number" ? "number" : "text"}
        value={(value.value as string) ?? ""}
        onChange={(e) => onChange({ ...value, value: e.target.value })}
        placeholder={value.type[0] === "Number" ? "0" : "Enter value…"}
        className="w-full rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-white/25 focus:outline-none"
      />
    );
  }

  if (value.type[0] === "Boolean") {
    return (
      <button
        type="button"
        onClick={() => onChange({ ...value, value: !value.value })}
        className={`flex h-5 w-9 items-center rounded-full border transition-colors ${
          value.value
            ? "border-teal-500/60 bg-teal-500/30"
            : "border-white/15 bg-white/5"
        }`}
      >
        <span
          className={`ml-0.5 h-3.5 w-3.5 rounded-full transition-transform ${
            value.value
              ? "translate-x-4 bg-teal-400"
              : "translate-x-0 bg-slate-500"
          }`}
        />
      </button>
    );
  }

  // action – render a Slot per param
  if (!value.shape.params || value.shape.params.length === 0) {
    return <p className="text-[10px] italic text-slate-600">No parameters</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {value.shape.params.map((p) => (
        <div key={p.name} className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] font-semibold text-slate-300">
              {p.name}
            </span>
            {p.required ? (
              <span className="text-[9px] font-bold uppercase tracking-wide text-rose-500">
                req
              </span>
            ) : (
              <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                opt
              </span>
            )}
          </div>
          {/* Recursive Slot for this param */}
          <TypeProvider entries={p.context}>
            <DeclarationProvider declarations={p.declarations}>
              <Slot
                shapes={shapes}
                accepts={p.type}
                label={p.type[0]}
                value={value.params?.[p.name] ?? null}
                onChange={(v) =>
                  onChange({
                    ...value,
                    params: { ...value.params, [p.name]: v },
                  })
                }
                depth={depth + 1}
              />
            </DeclarationProvider>
          </TypeProvider>
        </div>
      ))}
    </div>
  );
}

// ─── Slot ─────────────────────────────────────────────────────────────────────

export type SlotProps = {
  shapes: ActionShape[];
  /** A shape is compatible if its type array intersects this list */
  accepts: string[];
  label?: string;
  value: SlotValue | null;
  onChange: (v: SlotValue | null) => void;
  depth?: number;
  jsContext?: JsContextEntry[];
  jsDeclarations?: string[];
};

export function Slot({
  shapes,
  accepts,
  label = "Element",
  value,
  onChange,
  depth = 0,
  jsContext,
  jsDeclarations,
}: SlotProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const apiTypeKeys = new Set(shapes.map((s) => s.type[0]));
  const allShapes = [
    ...PRIMITIVE_SHAPES.filter((s) => !apiTypeKeys.has(s.type[0])),
    ...shapes,
  ];
  const compatible = allShapes.filter((s) => matchesAccepts(s, accepts));

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (shape: ActionShape) => {
    onChange(initSlotValue(shape));
    setOpen(false);
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!value) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-white/20 bg-white/[0.02] px-3 py-2 text-xs text-slate-500 transition hover:border-white/35 hover:text-slate-300"
        >
          <span className="text-base leading-none">＋</span>
          <span>{label}</span>
        </button>
        {open && (
          <ShapeSelectDropdown shapes={compatible} onSelect={handleSelect} />
        )}
      </div>
    );
  }

  // ── Filled state ─────────────────────────────────────────────────────────
  const rendererType = resolveRenderer(value.shape.type);
  const cfg = RENDERER_CONFIGS[rendererType];

  return (
    <div
      ref={ref}
      className={`relative flex flex-col gap-2.5 rounded-xl border ${cfg.border} ${cfg.bg} p-3`}
      style={{ marginLeft: depth > 0 ? 0 : undefined }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className={`shrink-0 ${cfg.iconColor(value.shape)}`}>
          {cfg.icon(value.shape)}
        </span>
        <span className="text-xs font-semibold text-white">
          {value.shape.type[0]}
        </span>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-[10px] text-slate-500 transition hover:text-slate-200"
          >
            change
          </button>
          <button
            onClick={() => onChange(null)}
            className="text-[10px] text-slate-500 transition hover:text-rose-400"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Context API preview — shown for shapes that expose scope variables */}
      {value.shape.context && value.shape.context.length > 0 && (
        <ContextPreview entries={value.shape.context} />
      )}

      {/* The form for this type */}
      <TypeProvider
        entries={[...(jsContext ?? []), ...(value.shape.context ?? [])]}
      >
        <DeclarationProvider
          declarations={[
            ...(jsDeclarations ?? []),
            ...(value.shape.declarations ?? []),
          ]}
        >
          <EnhancedSlotForm
            value={value}
            onChange={onChange}
            shapes={shapes}
            depth={depth}
          />
        </DeclarationProvider>
      </TypeProvider>

      {/* Change dropdown */}
      {open && (
        <ShapeSelectDropdown shapes={compatible} onSelect={handleSelect} />
      )}
    </div>
  );
}
