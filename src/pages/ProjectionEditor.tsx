/**
 * ProjectionEditor
 *
 * Allows creating and editing projections backed by the projection API.
 * Each web-component prop can be configured as either:
 *   - A static JSON literal (textarea)
 *   - An action result: the user composes a Slot; on the backend the value
 *     is stored as { __action: <serialised slot>, __result_key: "result" }
 */

import { useEffect, useRef, useState } from "react";
import {
  useCreateProjection,
  useUpdateProjection,
  useProjectionDefinition,
} from "../services/projectionsApi";
import { useActionShapes } from "../services/actionsApi";
import { WEB_COMPONENT_REGISTRY } from "../web-components/registry";
import type { PropDef } from "../web-components/registry";
import {
  serializeSlot,
  deserializeSlot,
} from "../components/runner/Slot/helpers";
import { Slot } from "../components/runner/Slot";
import type {
  EditableProjection,
  EditableComponent,
  EditablePropValue,
  PropMode,
  Projection,
} from "../types/projections";
import type { SlotValue } from "../types/builder";
import type { ActionShape } from "../types/actions";

// ─── Serialization helpers ────────────────────────────────────────────────────

function serializePropValue(v: EditablePropValue): unknown {
  if (v.mode === "action") {
    if (!v.actionValue) return null;
    return { __action: serializeSlot(v.actionValue), __result_key: "result" };
  }
  try {
    return JSON.parse(v.staticValue);
  } catch {
    return v.staticValue;
  }
}

export function serializeEditableProjection(
  ep: EditableProjection,
): Omit<Projection, "id"> & { id?: string } {
  return {
    id: ep.id,
    title: ep.title,
    web_components: ep.components.map((c) => ({
      type: c.type,
      props: Object.fromEntries(
        Object.entries(c.props).map(([k, v]) => [k, serializePropValue(v)]),
      ),
    })),
  };
}

function deserializePropValue(
  raw: unknown,
  shapes: ActionShape[] | undefined,
): EditablePropValue {
  if (raw !== null && typeof raw === "object" && "__action" in raw) {
    const r = raw as { __action: unknown; __result_key: string };
    return {
      mode: "action",
      staticValue: "",
      actionValue: deserializeSlot(r.__action, shapes ?? []),
    };
  }
  return {
    mode: "static",
    staticValue:
      raw === undefined || raw === null
        ? ""
        : typeof raw === "string"
          ? raw
          : JSON.stringify(raw, null, 2),
    actionValue: null,
  };
}

export function deserializeProjection(
  p: Projection,
  shapes: ActionShape[] | undefined,
): EditableProjection {
  return {
    id: p.id,
    title: p.title,
    components: p.web_components.map((bc) => {
      const entry = WEB_COMPONENT_REGISTRY[bc.type];
      const defs: readonly PropDef[] = entry?.propDefs ?? [];
      const props: Record<string, EditablePropValue> = {};
      for (const pd of defs) {
        props[pd.name] =
          pd.name in bc.props
            ? deserializePropValue(bc.props[pd.name], shapes)
            : {
                mode: "static",
                staticValue: pd.defaultStatic,
                actionValue: null,
              };
      }
      return { type: bc.type, props };
    }),
  };
}

export function makeBlankComponent(type: string): EditableComponent {
  const entry = WEB_COMPONENT_REGISTRY[type];
  const props: Record<string, EditablePropValue> = {};
  for (const pd of entry?.propDefs ?? []) {
    props[pd.name] = {
      mode: "static",
      staticValue: pd.defaultStatic,
      actionValue: null,
    };
  }
  return { type, props };
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-8-8h16" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
      />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ─── PropModeToggle ───────────────────────────────────────────────────────────

function PropModeToggle({
  mode,
  supportsAction,
  onChange,
}: {
  mode: PropMode;
  supportsAction: boolean;
  onChange: (m: PropMode) => void;
}) {
  if (!supportsAction) return null;
  return (
    <div className="flex rounded overflow-hidden border border-white/10 shrink-0">
      {(["static", "action"] as PropMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-colors ${
            mode === m
              ? "bg-white/10 text-slate-200"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

// ─── PropEditor ───────────────────────────────────────────────────────────────

function PropEditor({
  pd,
  value,
  shapes,
  onChange,
}: {
  pd: PropDef;
  value: EditablePropValue;
  shapes: ActionShape[] | undefined;
  onChange: (v: EditablePropValue) => void;
}) {
  const isComplex =
    pd.defaultStatic.trimStart().startsWith("[") ||
    pd.defaultStatic.trimStart().startsWith("{");

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label row */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-semibold text-slate-300">
          {pd.name}
        </span>
        {pd.required && (
          <span className="text-[9px] font-bold uppercase tracking-wide text-rose-500">
            req
          </span>
        )}
        {pd.description && (
          <span className="text-[9px] text-slate-600 truncate">
            {pd.description}
          </span>
        )}
        <div className="ml-auto">
          <PropModeToggle
            mode={value.mode}
            supportsAction={pd.supportsAction}
            onChange={(m) => onChange({ ...value, mode: m })}
          />
        </div>
      </div>

      {/* Value editor */}
      {value.mode === "static" ? (
        isComplex ? (
          <textarea
            rows={4}
            value={value.staticValue}
            onChange={(e) =>
              onChange({ ...value, staticValue: e.target.value })
            }
            spellCheck={false}
            className="w-full resize-y rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 font-mono text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-white/25 focus:outline-none"
          />
        ) : (
          <input
            type="text"
            value={value.staticValue.replace(/^"|"$/g, "")}
            onChange={(e) =>
              onChange({
                ...value,
                staticValue: JSON.stringify(e.target.value),
              })
            }
            className="w-full rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-white/25 focus:outline-none"
          />
        )
      ) : (
        <div className="border border-white/8 rounded-lg p-2 bg-black/10">
          <Slot
            shapes={shapes ?? []}
            accepts={["Action", "Element"]}
            label="Action"
            value={value.actionValue}
            onChange={(sv: SlotValue | null) =>
              onChange({ ...value, actionValue: sv })
            }
          />
        </div>
      )}
    </div>
  );
}

// ─── ComponentEditor ──────────────────────────────────────────────────────────

export function ComponentEditor({
  comp,
  shapes,
  onChange,
  onRemove,
}: {
  comp: EditableComponent;
  shapes: ActionShape[] | undefined;
  onChange: (c: EditableComponent) => void;
  onRemove: () => void;
}) {
  const entry = WEB_COMPONENT_REGISTRY[comp.type];
  const defs: readonly PropDef[] = entry?.propDefs ?? [];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      {/* Component header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8">
        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
          {comp.type}
        </span>
        <button
          onClick={onRemove}
          title="Remove component"
          className="ml-auto flex items-center gap-1 text-[10px] text-slate-600 hover:text-rose-400 transition-colors"
        >
          <IconTrash className="w-3 h-3" />
          Remove
        </button>
      </div>

      {/* Props */}
      <div className="flex flex-col gap-4 p-3">
        {defs.length === 0 ? (
          <p className="text-[10px] italic text-slate-600">
            No configurable props.
          </p>
        ) : (
          defs.map((pd) => (
            <PropEditor
              key={pd.name}
              pd={pd}
              value={
                comp.props[pd.name] ?? {
                  mode: "static",
                  staticValue: pd.defaultStatic,
                  actionValue: null,
                }
              }
              shapes={shapes}
              onChange={(v) =>
                onChange({
                  ...comp,
                  props: { ...comp.props, [pd.name]: v },
                })
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── AddComponentDropdown ─────────────────────────────────────────────────────

export function AddComponentDropdown({
  onAdd,
}: {
  onAdd: (type: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const types = Object.keys(WEB_COMPONENT_REGISTRY);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/20 px-3 py-1.5 text-xs text-slate-500 transition hover:border-white/35 hover:text-slate-300"
      >
        <IconPlus className="w-3.5 h-3.5" />
        Add component
        <IconChevronDown className="w-3 h-3 ml-0.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 min-w-[160px] rounded-xl border border-white/15 bg-[#0c1220]/95 shadow-xl backdrop-blur-sm">
          <div className="py-1">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => {
                  onAdd(t);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/8 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProjectionEditor ─────────────────────────────────────────────────────────

export type ProjectionEditorProps = {
  /**
   * Pass the id of an existing projection to edit it.
   * The editor will fetch the raw definition (with __action descriptors)
   * from GET /admin/projections/{id}/definition.
   * Omit to create a new projection.
   */
  editId?: string;
  onCancel: () => void;
  /** Called with the saved projection id after a successful save. */
  onSaved: (id: string) => void;
};

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? ""}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function ProjectionEditor({
  editId,
  onCancel,
  onSaved,
}: ProjectionEditorProps) {
  const { data: shapes } = useActionShapes();
  const [createProjection, { isLoading: isCreating }] = useCreateProjection();
  const [updateProjection, { isLoading: isUpdating }] = useUpdateProjection();

  // Fetch raw definition (unresolved __action descriptors) when editing.
  const { data: definition, isLoading: isLoadingDefinition } =
    useProjectionDefinition(editId ?? "", { skip: !editId });

  const isSaving = isCreating || isUpdating;
  const isEditMode = Boolean(editId);

  const [editable, setEditable] = useState<EditableProjection>(() => ({
    title: "",
    components: [],
  }));
  const [saveError, setSaveError] = useState<string | null>(null);

  // Once BOTH the raw definition and the shapes catalogue are loaded, initialise
  // the editable state from the definition so that action props are properly
  // detected (not collapsed to static values like the resolved endpoint would).
  const lastInitId = useRef<string | null>(null);
  useEffect(() => {
    if (!editId || !definition || !shapes) return;
    if (lastInitId.current === editId) return; // already initialised
    lastInitId.current = editId;
    setEditable(deserializeProjection(definition, shapes));
  }, [editId, definition, shapes]);

  // Show a loading gate while fetching the definition to avoid a flash of
  // blank / incorrect state.
  if (isEditMode && (isLoadingDefinition || lastInitId.current !== editId)) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-xs text-slate-400">
        <IconSpinner className="w-4 h-4" />
        Loading definition…
      </div>
    );
  }

  function setTitle(title: string) {
    setEditable((e) => ({ ...e, title }));
  }

  function addComponent(type: string) {
    setEditable((e) => ({
      ...e,
      components: [...e.components, makeBlankComponent(type)],
    }));
  }

  function updateComponent(i: number, c: EditableComponent) {
    setEditable((e) => {
      const components = [...e.components];
      components[i] = c;
      return { ...e, components };
    });
  }

  function removeComponent(i: number) {
    setEditable((e) => ({
      ...e,
      components: e.components.filter((_, idx) => idx !== i),
    }));
  }

  async function handleSave() {
    setSaveError(null);
    const payload = serializeEditableProjection(editable);
    try {
      if (isEditMode && editable.id) {
        const result = await updateProjection({
          ...payload,
          id: editable.id,
        });
        onSaved(result!.id);
      } else {
        const result = await createProjection(payload);
        onSaved(result!.id);
      }
    } catch {
      setSaveError("Failed to save projection. Check the console for details.");
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {isEditMode ? "Edit projection" : "New projection"}
        </p>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-400 transition hover:border-white/20 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !editable.title.trim()}
            className="rounded-lg border border-teal-500/40 bg-teal-500/15 px-3 py-1 text-xs font-semibold text-teal-300 transition hover:bg-teal-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {/* Error */}
        {saveError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {saveError}
          </div>
        )}

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Title
          </label>
          <input
            type="text"
            value={editable.title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My projection…"
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-white/25 focus:outline-none"
          />
        </div>

        {/* Components */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Components
            {editable.components.length > 0 && (
              <span className="ml-2 text-slate-600 font-normal normal-case tracking-normal">
                {editable.components.length}
              </span>
            )}
          </p>

          {editable.components.length === 0 && (
            <p className="text-xs italic text-slate-600">
              No components yet. Use the button below to add one.
            </p>
          )}

          {editable.components.map((comp, i) => (
            <ComponentEditor
              key={i}
              comp={comp}
              shapes={shapes}
              onChange={(c) => updateComponent(i, c)}
              onRemove={() => removeComponent(i)}
            />
          ))}

          <AddComponentDropdown onAdd={addComponent} />
        </div>
      </div>
    </div>
  );
}
