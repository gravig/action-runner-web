import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useSocket } from "../hooks/useSocket";
import {
  logsApi,
  parseLogLine,
  useGetLogsQuery,
  type LogEntry,
} from "../services/logsApi";
import type { AppDispatch } from "../store";
import { JsonHighlight } from "./runner/JsonHighlight";

const badgeByStatus: Record<string, string> = {
  idle: "border-white/20 text-white/80",
  connecting: "border-lagoon/60 text-lagoon",
  open: "border-lime/70 text-lime",
  closed: "border-white/20 text-white/60",
  error: "border-red-400 text-red-300",
};

function tryParseJson(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return null;
  }
}

const levelColor: Record<string, string> = {
  INFO: "text-sky-400",
  WARN: "text-amber-400",
  WARNING: "text-amber-400",
  ERROR: "text-red-400",
  DEBUG: "text-slate-400",
  LIVE: "text-lime-400",
};

function LogRow({ log }: { log: LogEntry }) {
  const pretty = tryParseJson(log.text);
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/5 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500">{log.ts}</span>
        <span
          className={`text-[10px] font-bold uppercase ${levelColor[log.level] ?? "text-slate-400"}`}
        >
          {log.level}
        </span>
      </div>
      {pretty ? (
        <pre className="mt-0.5 whitespace-pre-wrap break-all text-[11px]">
          <JsonHighlight json={pretty} />
        </pre>
      ) : (
        <span className="whitespace-pre-wrap break-all text-[11px] text-slate-100">
          {log.text}
        </span>
      )}
    </div>
  );
}

function TerminalPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { status, lastMessage, error } = useSocket();
  const {
    data: logs = [],
    isLoading,
    isError,
    error: fetchError,
  } = useGetLogsQuery();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (!lastMessage) return;
    dispatch(
      logsApi.util.updateQueryData("getLogs", undefined, (draft) => {
        const entry: LogEntry = parseLogLine(lastMessage, "LIVE");
        draft.push(entry);
        if (draft.length > 500) {
          draft.splice(0, draft.length - 500);
        }
      }),
    );
  }, [dispatch, lastMessage]);

  return (
    <div className="flex flex-col h-full min-h-0 p-0 glass-panel">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">
            Server Terminal
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
              badgeByStatus[status] ?? badgeByStatus.idle
            }`}
          >
            {status}
          </span>
        </div>
        {error ? <span className="text-xs text-red-300">{error}</span> : null}
      </div>

      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <div className="flex flex-col gap-0 font-mono text-xs bg-black">
          {isLoading ? (
            <div className="px-3 py-2 text-slate-300">
              Loading saved logs...
            </div>
          ) : null}

          {!isLoading && isError ? (
            <div className="px-3 py-2 text-red-300">
              Failed to load logs:{" "}
              {(fetchError as { status?: string })?.status || "Error"}
            </div>
          ) : null}

          {!isLoading && !isError && logs.length === 0 ? (
            <div className="px-3 py-2 text-slate-300">No log entries yet.</div>
          ) : null}

          {!isLoading && !isError
            ? logs.map((log, idx) => (
                <LogRow
                  key={`${log.ts}-${idx}-${log.text.slice(0, 8)}`}
                  log={log}
                />
              ))
            : null}
        </div>
      </div>
    </div>
  );
}

export default TerminalPanel;
