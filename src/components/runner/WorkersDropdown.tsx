import { useEffect, useRef, useState } from "react";
import type { Worker } from "../../pages/Workers";

type Props = {
  workers: Worker[];
  value: Worker | null;
  onChange: (worker: Worker) => void;
};

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.2}
    >
      <polyline
        strokeLinecap="round"
        strokeLinejoin="round"
        points="6 9 12 15 18 9"
      />
    </svg>
  );
}

function ServerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="3" width="20" height="5" rx="1.5" />
      <rect x="2" y="10" width="20" height="5" rx="1.5" />
      <rect x="2" y="17" width="20" height="5" rx="1.5" />
      <circle cx="18.5" cy="5.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="19.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full shrink-0 ${
        online
          ? "bg-emerald-400 shadow-[0_0_5px_1px_rgba(52,211,153,0.5)]"
          : "bg-red-500 shadow-[0_0_5px_1px_rgba(239,68,68,0.4)]"
      }`}
    />
  );
}

export function WorkersDropdown({ workers, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const isOnline = true; // all workers in the stream are connected
  const displayName = value ? (value.hostname ?? value.id) : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/12 hover:text-white max-w-[220px]"
      >
        <ServerIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        {value ? (
          <>
            <StatusDot online={isOnline} />
            <span className="truncate">{displayName}</span>
          </>
        ) : (
          <span className="text-slate-400">Select worker…</span>
        )}
        <IconChevron open={open} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/15 bg-[#0c1220]/95 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Workers
            </span>
            <span className="text-[10px] text-slate-500">
              {workers.length} connected
            </span>
          </div>
          <div className="flex flex-col gap-0.5 p-1.5 max-h-[320px] overflow-auto">
            {workers.map((worker) => {
              const selected = value?.id === worker.id;
              return (
                <button
                  key={worker.id}
                  onClick={() => {
                    onChange(worker);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-left transition ${
                    selected
                      ? "bg-lagoon/20 border border-lagoon/30 text-white"
                      : "hover:bg-white/7 border border-transparent text-slate-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-center border rounded-lg h-7 w-7 shrink-0 border-white/10 bg-white/5 text-slate-400">
                    <ServerIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-xs font-semibold truncate">
                      {worker.hostname ?? worker.id}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 truncate">
                      {worker.ip}:{worker.port}
                    </span>
                  </div>
                  <div className="ml-auto shrink-0">
                    <StatusDot online={true} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
