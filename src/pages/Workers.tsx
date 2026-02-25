import { useWorkers } from "../hooks/useWorkers";
import type { WorkersConnectionStatus } from "../hooks/useWorkers";

export interface Worker {
  id: string;
  ip: string;
  port: number;
  hostname: string | null;
  memory_mb: number;
  cores: number;
  labels: Record<string, string>;
  registered_at: string;
  last_seen_at: string;
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

function ConnStatusBadge({ status }: { status: WorkersConnectionStatus }) {
  const styles: Record<WorkersConnectionStatus, string> = {
    connecting: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    connected: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    disconnected: "text-red-400 border-red-500/30 bg-red-500/10",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function StatusDot() {
  return (
    <span
      title="Online"
      className="inline-block h-2.5 w-2.5 rounded-full shrink-0 bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.45)]"
    />
  );
}

function WorkerRow({ worker }: { worker: Worker }) {
  const displayName = worker.hostname ?? worker.id;
  const address = `${worker.ip}:${worker.port}`;
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-panel backdrop-blur transition hover:border-white/20 hover:bg-white/8">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400">
        <ServerIcon className="h-5 w-5" />
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold text-slate-100 truncate">
          {displayName}
        </span>
        <span className="font-mono text-xs text-slate-400 truncate">
          {address}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3 shrink-0">
        <span className="text-[10px] text-slate-500">
          {worker.cores}c / {worker.memory_mb}MB
        </span>
        <div className="flex items-center gap-1.5">
          <StatusDot />
          <span className="text-xs font-medium text-emerald-400">online</span>
        </div>
      </div>
    </div>
  );
}

export function Workers() {
  const { workers, connStatus } = useWorkers();

  return (
    <div className="mx-auto w-full max-w-2xl px-2 py-8 space-y-6">
      <div className="glass-panel px-6 py-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Workers
          </p>
          <ConnStatusBadge status={connStatus} />
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          Connected nodes
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {workers.length} worker{workers.length !== 1 ? "s" : ""} connected
        </p>
      </div>

      {workers.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-sm text-slate-500">
          {connStatus === "connecting"
            ? "Connecting to master node…"
            : "No workers connected"}
        </div>
      ) : (
        <div className="space-y-3">
          {workers.map((worker) => (
            <WorkerRow key={worker.id} worker={worker} />
          ))}
        </div>
      )}
    </div>
  );
}
