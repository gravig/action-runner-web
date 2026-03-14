import { useState } from "react";
import {
  useAssets,
  useAssetContent,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
} from "../services/assetsApi";
import type { AssetMetadata, CreateAssetPayload } from "../types/assets";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconFile({ className }: { className?: string }) {
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function IconJSON({ className }: { className?: string }) {
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
        d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function IconText({ className }: { className?: string }) {
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
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
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
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"
      />
    </svg>
  );
}

function IconEdit({ className }: { className?: string }) {
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
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
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
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Extension badge + icon helpers ──────────────────────────────────────────

const EXT_COLORS: Record<string, string> = {
  json: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  txt: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  md: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

function extColor(ext: string) {
  return (
    EXT_COLORS[ext.toLowerCase()] ?? "text-slate-400 bg-white/5 border-white/10"
  );
}

function ExtBadge({ ext }: { ext: string }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase border ${extColor(ext)}`}
    >
      {ext}
    </span>
  );
}

function ExtIcon({ ext, className }: { ext: string; className?: string }) {
  if (ext.toLowerCase() === "json") return <IconJSON className={className} />;
  if (ext.toLowerCase() === "txt" || ext.toLowerCase() === "md")
    return <IconText className={className} />;
  return <IconFile className={className} />;
}

// ─── Content preview ─────────────────────────────────────────────────────────

function ContentPreview({ id, extension }: { id: string; extension: string }) {
  const { data, isLoading, isError } = useAssetContent(id);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 p-4">
        <IconSpinner className="w-4 h-4" /> Loading content…
      </div>
    );
  }

  if (isError) {
    return <p className="text-xs text-red-400 p-4">Failed to load content.</p>;
  }

  const isJSON = extension.toLowerCase() === "json";

  if (isJSON) {
    const pretty =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return (
      <pre className="text-xs leading-relaxed text-teal-300 overflow-auto whitespace-pre-wrap break-all">
        {pretty}
      </pre>
    );
  }

  return (
    <pre className="text-xs leading-relaxed text-slate-300 overflow-auto whitespace-pre-wrap break-words">
      {String(data ?? "")}
    </pre>
  );
}

// ─── Create / Edit modal ──────────────────────────────────────────────────────

const SUPPORTED_EXTENSIONS = ["json", "txt", "md"];

interface AssetModalProps {
  initial?: AssetMetadata & { rawContent?: string };
  onClose: () => void;
}

function AssetModal({ initial, onClose }: AssetModalProps) {
  const isEdit = !!initial?.id;
  const [name, setName] = useState(initial?.name ?? "");
  const [extension, setExtension] = useState(initial?.extension ?? "json");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [content, setContent] = useState(initial?.rawContent ?? "");
  const [error, setError] = useState<string | null>(null);

  const [createAsset, { isLoading: creating }] = useCreateAsset();
  const [updateAsset, { isLoading: updating }] = useUpdateAsset();
  const busy = creating || updating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!content.trim()) {
      setError("Content is required.");
      return;
    }

    try {
      if (isEdit) {
        await updateAsset({
          id: initial!.id,
          name: name.trim(),
          description: description.trim() || undefined,
          content: content.trim(),
        });
      } else {
        const payload: CreateAssetPayload = {
          name: name.trim(),
          extension: extension.trim(),
          content: content.trim(),
          description: description.trim() || undefined,
        };
        await createAsset(payload);
      }
      onClose();
    } catch (err) {
      setError(String(err) || "Request failed.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e1117] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-sm font-semibold text-slate-100">
            {isEdit
              ? `Edit — ${initial!.name}.${initial!.extension}`
              : "New Asset"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-5 overflow-y-auto flex-1"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-data"
                className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Extension
              </span>
              {isEdit ? (
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-400 cursor-not-allowed">
                  {initial!.extension}
                </div>
              ) : (
                <select
                  value={extension}
                  onChange={(e) => setExtension(e.target.value)}
                  className="rounded-lg bg-[#0e1117] border border-white/10 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500/60"
                >
                  {SUPPORTED_EXTENSIONS.map((ext) => (
                    <option key={ext} value={ext}>
                      {ext}
                    </option>
                  ))}
                </select>
              )}
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Description <span className="normal-case">— optional</span>
            </span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20"
            />
          </label>

          <label className="flex flex-col gap-1.5 flex-1 min-h-0">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Content
            </span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                extension === "json"
                  ? '{\n  "key": "value"\n}'
                  : "Plain text content"
              }
              rows={10}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 resize-y"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-night hover:bg-teal-400 disabled:opacity-50 transition-colors"
          >
            {busy && <IconSpinner className="w-3 h-3" />}
            {isEdit ? "Save Changes" : "Create Asset"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Asset detail panel ───────────────────────────────────────────────────────

interface AssetPanelProps {
  asset: AssetMetadata;
  onEdit: () => void;
  onDeleted: () => void;
}

function AssetPanel({ asset, onEdit, onDeleted }: AssetPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteAsset, { isLoading: deleting }] = useDeleteAsset();

  async function handleDelete() {
    await deleteAsset(asset.id);
    onDeleted();
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-white/8 shrink-0">
        <div className={`p-2 rounded-xl border ${extColor(asset.extension)}`}>
          <ExtIcon ext={asset.extension} className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-slate-100 truncate">
              {asset.name}.{asset.extension}
            </h2>
            <ExtBadge ext={asset.extension} />
          </div>
          {asset.description && (
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
              {asset.description}
            </p>
          )}
          <p className="mt-1 text-[10px] text-slate-700 font-mono">
            id: {asset.id}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-teal-500/40 hover:text-teal-300 transition-colors"
          >
            <IconEdit className="w-3.5 h-3.5" />
            Edit
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-red-400">Confirm?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <IconSpinner className="w-3.5 h-3.5" />
                ) : (
                  "Yes, delete"
                )}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-red-500/40 hover:text-red-400 transition-colors"
            >
              <IconTrash className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-5">
        <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/8 bg-white/[0.02]">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Content
            </span>
            <ExtBadge ext={asset.extension} />
          </div>
          <div className="p-4 overflow-auto max-h-[calc(100vh-260px)]">
            <ContentPreview id={asset.id} extension={asset.extension} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar asset row ────────────────────────────────────────────────────────

function AssetRow({
  asset,
  selected,
  onClick,
}: {
  asset: AssetMetadata;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        selected
          ? "bg-teal-500/10 border border-teal-500/20"
          : "border border-transparent hover:bg-white/5"
      }`}
    >
      <ExtIcon
        ext={asset.extension}
        className={`w-4 h-4 shrink-0 ${selected ? "text-teal-400" : "text-slate-500"}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium truncate ${selected ? "text-teal-300" : "text-slate-300"}`}
          >
            {asset.name}
          </span>
          <ExtBadge ext={asset.extension} />
        </div>
        {asset.description && (
          <p className="text-[10px] text-slate-600 truncate mt-0.5">
            {asset.description}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Assets() {
  const { data: assets = [], isLoading, isError } = useAssets();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editAsset, setEditAsset] = useState<AssetMetadata | null>(null);
  const [editRawContent, setEditRawContent] = useState<string | undefined>(
    undefined,
  );

  const { data: editContent } = useAssetContent(editAsset?.id ?? "", {
    skip: !editAsset,
  });

  const filtered = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.extension.toLowerCase().includes(search.toLowerCase()) ||
      (a.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const selected = assets.find((a) => a.id === selectedId) ?? null;

  function openEditModal(asset: AssetMetadata) {
    setEditAsset(asset);
    const raw =
      editContent === undefined
        ? ""
        : typeof editContent === "string"
          ? editContent
          : JSON.stringify(editContent, null, 2);
    setEditRawContent(raw);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditAsset(null);
    setEditRawContent(undefined);
  }

  return (
    <div className="flex flex-1 min-h-0 gap-4 h-full">
      {/* ── Modal ── */}
      {showModal && (
        <AssetModal
          initial={
            editAsset ? { ...editAsset, rawContent: editRawContent } : undefined
          }
          onClose={closeModal}
        />
      )}

      {/* ── Left sidebar ── */}
      <div className="w-64 shrink-0 flex flex-col gap-3 min-h-0">
        {/* New Asset button */}
        <button
          onClick={() => {
            setEditAsset(null);
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-2.5 text-xs font-semibold text-teal-400 hover:bg-teal-500/15 transition-colors"
        >
          <IconPlus className="w-4 h-4" />
          New Asset
        </button>

        {/* Search */}
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets…"
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-teal-500/40"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 pt-8 text-xs text-slate-500">
              <IconSpinner className="w-4 h-4" /> Loading…
            </div>
          )}
          {isError && (
            <p className="text-xs text-red-400 px-3 pt-4">
              Failed to load assets.
            </p>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <p className="text-xs text-slate-600 px-3 pt-4 italic">
              {search ? "No matches." : "No assets yet. Create one!"}
            </p>
          )}
          <div className="flex flex-col gap-1 pb-4">
            {filtered.map((a) => (
              <AssetRow
                key={a.id}
                asset={a}
                selected={a.id === selectedId}
                onClick={() => setSelectedId(a.id === selectedId ? null : a.id)}
              />
            ))}
          </div>
        </div>

        {/* Stats footer */}
        {assets.length > 0 && (
          <div className="shrink-0 px-1 pb-1">
            <p className="text-[10px] text-slate-700">
              {assets.length} asset{assets.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* ── Main panel ── */}
      <div className="flex-1 min-w-0 rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden flex flex-col">
        {selected ? (
          <AssetPanel
            key={selected.id}
            asset={selected}
            onEdit={() => openEditModal(selected)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-8">
            <div className="rounded-full border border-white/10 bg-white/5 p-4">
              <IconFile className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">
              Select an asset
            </p>
            <p className="text-xs text-slate-600 max-w-xs">
              Choose an asset from the sidebar to view and edit its content, or
              create a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Assets;
