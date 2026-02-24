import { useState } from "react";
import {
  useGetActionShapesQuery,
  useRunActionMutation,
} from "../services/actionsApi";
import { TypesDropdown } from "../components/runner/TypesDropdown";
import { Builder } from "../components/runner/Builder";
import { SaveCustomActionModal } from "../components/runner/SaveCustomActionModal";
import { serializeSlot } from "../components/runner/Slot/helpers";
import type { SlotValue } from "../types/builder";

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

function Runner() {
  const { data, error, isLoading } = useGetActionShapesQuery();
  const [runAction, { isLoading: isRunning }] = useRunActionMutation();
  const [builderValue, setBuilderValue] = useState<SlotValue | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  return (
    <>
      <div className="h-full glass-panel">
        <div className="h-full p-4 overflow-auto">
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-4">
            {data && <TypesDropdown shapes={data} />}
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
                    const result = await runAction(payload).unwrap();
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
          {error && (
            <p className="text-sm text-red-400">
              Error: {"status" in error ? error.status : "Unknown error"}
            </p>
          )}
          {data && (
            <>
              {/* Builder */}
              <div className="mb-6">
                <Builder
                  shapes={data}
                  value={builderValue}
                  onChange={setBuilderValue}
                />
              </div>
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
    </>
  );
}

export default Runner;
