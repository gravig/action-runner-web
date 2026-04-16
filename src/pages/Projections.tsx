import { useEffect, useRef, useState } from "react";
import {
  useProjections,
  useProjection,
  useProjectionDefinition,
  useUpdateProjection,
} from "../services/projectionsApi";
import { useActionShapes } from "../services/actionsApi";
import { renderBackendComponent } from "../web-components";
import { MOCK_PROJECTIONS_LIST, MOCK_PROJECTIONS } from "./projectionsMock";
import {
  ProjectionEditor,
  ComponentEditor,
  AddComponentDropdown,
  makeBlankComponent,
  serializeEditableProjection,
  deserializeProjection,
} from "./ProjectionEditor";
import type {
  EditableProjection,
  EditableComponent,
} from "../types/projections";
import { LayoutManager } from "../components/LayoutManager";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconGrid({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconChevron({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

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

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4.5 1.5 1.5-4.5 12.362-12.226z"
      />
    </svg>
  );
}

// ─── ProjectionCanvas ─────────────────────────────────────────────────────────
// Unified component: view mode renders components, edit mode shows inline prop
// editors with drag-to-reorder. No separate page navigation required.

function ProjectionCanvas({ id, isMocked }: { id: string; isMocked: boolean }) {
  // ── Resolved (view) data ────────────────────────────────────────────────
  const {
    data: viewData,
    isLoading,
    error,
  } = useProjection(id, { skip: isMocked });
  const displayData = isMocked
    ? (MOCK_PROJECTIONS[id] ?? null)
    : (viewData ?? null);

  // ── Edit state ──────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const { data: shapes } = useActionShapes();
  const { data: definition, isLoading: defLoading } = useProjectionDefinition(
    id,
    { skip: isMocked || !isEditing },
  );
  const [editable, setEditable] = useState<EditableProjection | null>(null);
  const initKey = useRef<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updateProjection, { isLoading: isSaving }] = useUpdateProjection();

  // Reset when the selected projection changes
  useEffect(() => {
    setIsEditing(false);
    initKey.current = null;
    setEditable(null);
    setSaveError(null);
  }, [id]);

  // Initialise editable from raw definition once both definition + shapes are ready
  useEffect(() => {
    if (!isEditing || !definition || !shapes || initKey.current === id) return;
    initKey.current = id;
    setEditable(deserializeProjection(definition, shapes));
  }, [isEditing, id, definition, shapes]);

  // ── Component helpers ───────────────────────────────────────────────────
  function updateComponent(i: number, c: EditableComponent) {
    setEditable((prev) => {
      if (!prev) return prev;
      const components = [...prev.components];
      components[i] = c;
      return { ...prev, components };
    });
  }

  function removeComponent(i: number) {
    setEditable((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        components: prev.components.filter((_, idx) => idx !== i),
      };
    });
  }

  function addComponent(type: string) {
    setEditable((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        components: [...prev.components, makeBlankComponent(type)],
      };
    });
  }

  // ── Save ────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!editable?.id) return;
    setSaveError(null);
    const payload = serializeEditableProjection(editable);
    try {
      await updateProjection({ ...payload, id: editable.id });
      setIsEditing(false);
      initKey.current = null; // allow re-init on next edit
    } catch {
      setSaveError("Save failed.");
    }
  }

  function cancelEdit() {
    setIsEditing(false);
    initKey.current = null;
    setEditable(null);
    setSaveError(null);
  }

  // ── View loading ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-xs text-slate-400">
        <IconSpinner className="w-4 h-4" />
        Loading projection…
      </div>
    );
  }

  if (error || !displayData) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-red-400">
        Failed to load projection.
      </div>
    );
  }

  const isDefLoading = isEditing && (defLoading || initKey.current !== id);
  const editComps = editable?.components ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Projection
          </p>
          {isEditing && editable ? (
            <input
              value={editable.title}
              onChange={(e) =>
                setEditable((prev) =>
                  prev ? { ...prev, title: e.target.value } : prev,
                )
              }
              className="bg-transparent border-b border-white/20 text-sm font-semibold text-white focus:outline-none focus:border-teal-400 transition-colors w-full"
            />
          ) : (
            <h2 className="text-sm font-semibold text-white truncate">
              {displayData.title}
            </h2>
          )}
        </div>
        {!isMocked && (
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                {saveError && (
                  <span className="text-[10px] text-red-400 mr-1">
                    {saveError}
                  </span>
                )}
                <button
                  onClick={cancelEdit}
                  className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-400 transition hover:border-white/20 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editable?.title.trim()}
                  className="rounded-lg border border-teal-500/40 bg-teal-500/15 px-3 py-1 text-xs font-semibold text-teal-300 transition hover:bg-teal-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving…" : "Save"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:border-violet-400/50 transition"
              >
                <IconPencil className="w-2.5 h-2.5" />
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Definition loading gate ── */}
      {isDefLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-xs text-slate-400">
          <IconSpinner className="w-4 h-4" />
          Loading definition…
        </div>
      ) : isEditing ? (
        /* ── Edit mode ── */
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
          {editComps.length === 0 ? (
            <p className="text-xs italic text-slate-600">
              No components yet. Use the button below to add one.
            </p>
          ) : (
            <LayoutManager
              editable
              cols={2}
              storageKey={`projection-layout-${id}`}
            >
              {editComps.map((comp, i) => (
                <LayoutManager.Panel
                  key={String(i)}
                  id={`panel-${i}`}
                  defaultW={1}
                  defaultH={5}
                >
                  <ComponentEditor
                    comp={comp}
                    shapes={shapes}
                    onChange={(c) => updateComponent(i, c)}
                    onRemove={() => removeComponent(i)}
                  />
                </LayoutManager.Panel>
              ))}
            </LayoutManager>
          )}
          <div className="mt-1">
            <AddComponentDropdown onAdd={addComponent} />
          </div>
        </div>
      ) : (
        /* ── View mode ── */
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
          {displayData.web_components.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              This projection has no components.
            </p>
          ) : (
            <LayoutManager cols={2} storageKey={`projection-layout-${id}`}>
              {displayData.web_components.map((bc, i) => (
                <LayoutManager.Panel
                  key={String(i)}
                  id={`panel-${i}`}
                  defaultW={1}
                  defaultH={5}
                >
                  {renderBackendComponent(bc, i)}
                </LayoutManager.Panel>
              ))}
            </LayoutManager>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Projections ──────────────────────────────────────────────────────────────

type PanelMode =
  | { kind: "empty" }
  | { kind: "view"; id: string }
  | { kind: "new" };

export function Projections() {
  const { data: apiData, isLoading, error } = useProjections();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelMode>({ kind: "empty" });

  // Fall back to mock data when the backend is unreachable.
  const isMocked = !isLoading && (!!error || !apiData);
  const listData = isMocked ? MOCK_PROJECTIONS_LIST : apiData;

  function selectProjection(id: string) {
    setSelectedId(id);
    setPanel({ kind: "view", id });
  }

  return (
    <div className="@container flex h-full text-sm overflow-hidden">
      {/* ── Sidebar: projection list ── */}
      <aside className="flex flex-col w-52 shrink-0 border-r border-white/10 overflow-y-auto">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
          <IconGrid className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Projections
          </span>
          <span className="ml-auto text-[10px] text-slate-600">
            {listData?.count ?? 0}
          </span>
        </div>

        {/* New projection button */}
        {!isMocked && (
          <button
            onClick={() => {
              setSelectedId(null);
              setPanel({ kind: "new" });
            }}
            className={`flex items-center gap-2 px-3 py-2 text-left transition-colors border-b border-white/5 ${
              panel.kind === "new"
                ? "bg-teal-500/10 text-teal-300"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
            }`}
          >
            <span className="text-base leading-none">໹</span>
            <span className="text-xs">New projection</span>
          </button>
        )}

        {/* Mock badge */}
        {isMocked && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/5 bg-amber-500/5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500/70">
              Mock data
            </span>
            <span className="text-[9px] text-slate-600">(API unavailable)</span>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
            <IconSpinner className="w-3.5 h-3.5" />
            Loading…
          </div>
        )}

        {listData?.projections.map((p) => (
          <button
            key={p.id}
            onClick={() => selectProjection(p.id)}
            className={`flex items-center gap-2 px-3 py-2 text-left transition-colors group ${
              selectedId === p.id
                ? "bg-white/8 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <span className="truncate text-xs flex-1">{p.title}</span>
            <IconChevron
              className={`w-3 h-3 shrink-0 transition-opacity ${
                selectedId === p.id
                  ? "opacity-60"
                  : "opacity-0 group-hover:opacity-40"
              }`}
            />
          </button>
        ))}

        {listData?.projections.length === 0 && !isLoading && (
          <p className="px-3 py-4 text-xs italic text-slate-600">
            No projections found.
          </p>
        )}
      </aside>

      {/* ── Main panel ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden glass-panel">
        {panel.kind === "new" && (
          <ProjectionEditor
            onCancel={() => setPanel({ kind: "empty" })}
            onSaved={(id) => {
              setSelectedId(id);
              setPanel({ kind: "view", id });
            }}
          />
        )}

        {panel.kind === "view" && (
          <ProjectionCanvas key={panel.id} id={panel.id} isMocked={isMocked} />
        )}

        {panel.kind === "empty" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-500">
            <IconGrid className="w-8 h-8 opacity-30" />
            <p className="text-xs">Select a projection to preview</p>
            {!isMocked && (
              <button
                onClick={() => setPanel({ kind: "new" })}
                className="mt-1 text-xs text-teal-400 hover:text-teal-200 transition"
              >
                or create a new one
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
