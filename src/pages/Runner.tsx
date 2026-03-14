import { useState } from "react";
import { FlowEditor } from "../components/runner/flow";
import { useActionShapes, useRunAction } from "../services/actionsApi";
import { WorkersDropdown } from "../components/runner/WorkersDropdown";
import { useWorkers } from "../hooks/useWorkers";
import type { Worker } from "./Workers";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Builder } from "../components/runner/Builder";
import { SaveCustomActionModal } from "../components/runner/SaveCustomActionModal";
import {
  serializeSlot,
  deserializeSlot,
} from "../components/runner/Slot/helpers";
import type { SlotValue } from "../types/builder";
import type { ActionShape } from "../types/actions";

// Keep replacer for the preview panel JSON display (strips shape, keeps readable)
function replacer(key: string, val: unknown) {
  if (key === "shape") return undefined;
  return val;
}

function IconSparkle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
      />
    </svg>
  );
}

function IconPlay({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function IconSliders({ className }: { className?: string }) {
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
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
      />
    </svg>
  );
}

type EditorMode = "default" | "advanced";

function EditorModeSwitch({
  value,
  onChange,
}: {
  value: EditorMode;
  onChange: (m: EditorMode) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-0.5">
      {(["default", "advanced"] as EditorMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
            value === mode
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

function Runner() {
  const [editorMode, setEditorMode] =
    useLocalStorage<EditorMode>("runner.editorMode");
  const { data, error, isLoading } = useActionShapes();
  const [runAction, { isLoading: isRunning }] = useRunAction();
  const { workers } = useWorkers();
  const [builderValue, setBuilderValue] = useState<SlotValue | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  // Auto-select first worker when list arrives and nothing is selected yet
  if (selectedWorker === null && workers.length > 0) {
    setSelectedWorker(workers[0]);
  }
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editShape, setEditShape] = useState<ActionShape | null>(null);

  return (
    <>
      <div className="h-full glass-panel">
        <div
          className={`h-full flex flex-col ${
            editorMode === "advanced" ? "overflow-hidden" : "overflow-auto"
          } p-4`}
        >
          {/* Toolbar */}
          <div className="flex flex-shrink-0 items-center gap-3 mb-4">
            <EditorModeSwitch value={editorMode} onChange={setEditorMode} />
            <div className="w-px h-4 bg-white/10" />
            <WorkersDropdown
              workers={workers}
              value={selectedWorker}
              onChange={setSelectedWorker}
            />
            {builderValue && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-violet-500/50 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-300 transition hover:border-violet-400/70 hover:bg-violet-500/25 hover:text-violet-200"
              >
                <IconSparkle className="w-3 h-3" />
                Save as Custom Action
              </button>
            )}
            {builderValue && (
              <button
                onClick={async () => {
                  setShowPreview((v) => !v);
                  const payload = serializeSlot(builderValue);
                  console.log("[Runner] action payload:", payload);
                  try {
                    const result = await runAction(payload);
                    console.log("[Runner] run result:", result);
                  } catch (err) {
                    console.error("[Runner] run error:", err);
                  }
                }}
                disabled={isRunning}
                className="flex items-center gap-1.5 rounded-lg border border-lime-500/50 bg-lime-500/15 px-3 py-1.5 text-xs font-semibold text-lime-400 transition hover:border-lime-400/70 hover:bg-lime-500/25 hover:text-lime-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconPlay className="w-3 h-3" />
                Run
              </button>
            )}
          </div>

          {/* Preview panel */}
          {showPreview && builderValue && (
            <div className="mb-4 border rounded-xl border-lime-500/25 bg-black/40">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-lime-500">
                  Preview
                </span>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-[10px] text-slate-500 hover:text-slate-200 transition"
                >
                  ✕
                </button>
              </div>
              <pre className="overflow-auto p-3 text-[10px] font-mono text-slate-300 whitespace-pre-wrap break-all">
                {JSON.stringify(builderValue, replacer, 2)}
              </pre>
            </div>
          )}

          {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
          {error && <p className="text-sm text-red-400">Error: {error}</p>}
          {data && (
            <>
              {editorMode === "default" && (
                /* ── Default: visual slot builder ── */
                <div className="mb-6">
                  <Builder
                    shapes={data}
                    value={builderValue}
                    onChange={setBuilderValue}
                  />
                </div>
              )}

              {editorMode === "advanced" && (
                /* ── Advanced: ReactFlow pipeline editor ── */
                <div className="flex-1 min-h-0">
                  <FlowEditor
                    onRun={async (payload) => {
                      console.log("[Runner] flow payload:", payload);
                      try {
                        const result = await runAction(payload);
                        console.log("[Runner] run result:", result);
                      } catch (err) {
                        console.error("[Runner] run error:", err);
                      }
                    }}
                    isRunning={isRunning}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showSaveModal && builderValue && data && (
        <SaveCustomActionModal
          shapes={data}
          initialPayload={builderValue}
          onClose={() => setShowSaveModal(false)}
          onSaved={() => {}}
        />
      )}

      {editShape && data && (
        <SaveCustomActionModal
          shapes={data}
          initialPayload={
            editShape.payload ? deserializeSlot(editShape.payload, data) : null
          }
          initialData={{
            actionName: editShape.type[0],
            summary: editShape.summary,
            tags: editShape.tags,
          }}
          onClose={() => setEditShape(null)}
          onSaved={() => setEditShape(null)}
        />
      )}
    </>
  );
}

export default Runner;
