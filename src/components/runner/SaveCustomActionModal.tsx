import { useEffect, useRef, useState } from "react";
import {
  useCreateCustomActionMutation,
  useUpdateCustomActionMutation,
} from "../../services/actionsApi";
import type { ActionShape } from "../../types/actions";
import type { SlotValue } from "../../types/builder";
import { Slot } from "./Slot/Slot";
import { serializeSlot } from "./Slot/helpers";

type InitialData = {
  actionName: string;
  summary?: string;
  tags?: string[];
};

type Props = {
  /** All available shapes — needed to render the payload Slot. */
  shapes: ActionShape[];
  /** Pre-populated payload value. In create mode this is the current builder value. */
  initialPayload: SlotValue | null;
  /** When provided the modal operates in edit mode. */
  initialData?: InitialData;
  onClose: () => void;
  onSaved: () => void;
};

function IconFullscreen({ className }: { className?: string }) {
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
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
      />
    </svg>
  );
}

function IconCompress({ className }: { className?: string }) {
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
        d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
      />
    </svg>
  );
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

export function SaveCustomActionModal({
  shapes,
  initialPayload,
  initialData,
  onClose,
  onSaved,
}: Props) {
  const isEditMode = Boolean(initialData);
  const [actionName, setActionName] = useState(initialData?.actionName ?? "");
  const [summary, setSummary] = useState(initialData?.summary ?? "");
  const [tagsInput, setTagsInput] = useState(
    initialData?.tags?.join(", ") ?? "",
  );
  const [payloadValue, setPayloadValue] = useState<SlotValue | null>(
    initialPayload,
  );
  const [createCustomAction, { isLoading: isCreating, error: createError }] =
    useCreateCustomActionMutation();
  const [updateCustomAction, { isLoading: isUpdating, error: updateError }] =
    useUpdateCustomActionMutation();
  const isLoading = isCreating || isUpdating;
  const error = createError ?? updateError;
  const nameRef = useRef<HTMLInputElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Focus name field on open
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = actionName.trim();
    if (!trimmed) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const serializedPayload = payloadValue ? serializeSlot(payloadValue) : null;

    try {
      if (isEditMode) {
        await updateCustomAction({
          actionName: trimmed,
          payload: serializedPayload,
          summary: summary.trim() || undefined,
          tags: tags.length ? tags : undefined,
        }).unwrap();
      } else {
        await createCustomAction({
          actionName: trimmed,
          payload: serializedPayload,
          summary: summary.trim() || undefined,
          tags: tags.length ? tags : undefined,
        }).unwrap();
      }
      onSaved();
      onClose();
    } catch {
      // error rendered below
    }
  }

  const apiError =
    error && "data" in error
      ? String((error.data as { detail?: string })?.detail ?? error.data)
      : error
        ? "Request failed"
        : null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${
          fullscreen ? "fixed inset-3" : "relative w-full max-w-2xl max-h-full"
        } rounded-2xl border border-violet-500/30 bg-[#0b1120] shadow-2xl flex flex-col overflow-hidden transition-all duration-200`}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-6 pt-6 pb-4 shrink-0">
          <IconSparkle className="w-5 h-5 text-violet-400 shrink-0" />
          <h2 className="text-sm font-semibold text-white">
            {isEditMode ? "Edit Custom Action" : "Save as Custom Action"}
          </h2>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition"
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {fullscreen ? (
                <IconCompress className="w-4 h-4" />
              ) : (
                <IconFullscreen className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition text-lg leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 overflow-auto px-6 pb-6"
        >
          {/* Action name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Action name
              <span className="text-rose-500 ml-0.5">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={actionName}
              onChange={(e) => !isEditMode && setActionName(e.target.value)}
              readOnly={isEditMode}
              placeholder="e.g. CreateDefaultBrandAction"
              required
              className={`rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition ${
                isEditMode
                  ? "opacity-60 cursor-not-allowed"
                  : "focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
              }`}
            />
            <p className="text-[10px] text-slate-600">
              {isEditMode ? (
                "Action name cannot be changed after creation."
              ) : (
                <>
                  Used as the class name — convention is{" "}
                  <span className="font-mono text-slate-500">PascalCase</span>.
                </>
              )}
            </p>
          </div>

          {/* Summary */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Summary
              <span className="text-slate-600 ml-1">(optional)</span>
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Short description of what this action does"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Tags
              <span className="text-slate-600 ml-1">(optional)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="brands, custom, …"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition"
            />
            <p className="text-[10px] text-slate-600">Comma-separated.</p>
          </div>

          {/* Payload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Payload
            </label>
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <Slot
                shapes={shapes}
                accepts={["Action", "Element"]}
                label="Action"
                value={payloadValue}
                onChange={setPayloadValue}
              />
            </div>
          </div>

          {/* API error */}
          {apiError && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
              {apiError}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:border-white/20 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !actionName.trim()}
              className="flex items-center gap-1.5 rounded-lg border border-violet-500/50 bg-violet-500/15 px-4 py-1.5 text-xs font-semibold text-violet-300 hover:border-violet-400/70 hover:bg-violet-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconSparkle className="w-3.5 h-3.5" />
              {isLoading ? "Saving…" : isEditMode ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
