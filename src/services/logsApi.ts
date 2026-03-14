import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { WORKER_BASE } from "./api";

export type LogEntry = {
  ts: string;
  level: string;
  text: string;
};

export type LogsResponse = {
  path: string;
  content: string;
};

export function parseLogLine(raw: string, fallbackLevel = "INFO"): LogEntry {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      ts: new Date().toLocaleTimeString(),
      level: fallbackLevel,
      text: "",
    };
  }
  const match = trimmed.match(/^(\d{2}:\d{2}:\d{2})\s+([A-Z]+)\s+(.*)$/);
  if (match) {
    return { ts: match[1], level: match[2], text: match[3] };
  }
  return {
    ts: new Date().toLocaleTimeString(),
    level: fallbackLevel,
    text: trimmed,
  };
}

function parseLogContent(content: string | undefined | null): LogEntry[] {
  if (!content) return [];
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseLogLine(line, "HIST"));
}

export async function fetchLogsFn(): Promise<LogEntry[]> {
  const res = await fetch(`${WORKER_BASE}/logs`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data: LogsResponse = await res.json();
  return parseLogContent(data.content);
}

export const fetchLogs = createAsyncThunk("logs/fetch", fetchLogsFn);

interface LogsState {
  entries: LogEntry[];
  isLoading: boolean;
  error: string | null;
}

const logsSlice = createSlice({
  name: "logs",
  initialState: { entries: [], isLoading: false, error: null } as LogsState,
  reducers: {
    pushLog(state, { payload }: PayloadAction<LogEntry>) {
      state.entries.push(payload);
      if (state.entries.length > 500) {
        state.entries.splice(0, state.entries.length - 500);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLogs.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.entries = payload;
      })
      .addCase(fetchLogs.rejected, (state, { error }) => {
        state.isLoading = false;
        state.error = error.message ?? "Failed to load logs";
      });
  },
});

export const logsReducer = logsSlice.reducer;
export const { pushLog } = logsSlice.actions;

type ThunkAppDispatch = ThunkDispatch<unknown, undefined, UnknownAction>;

export function useGetLogsQuery() {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { entries, isLoading, error } = useSelector(
    (s: { logs: LogsState }) => s.logs,
  );
  useEffect(() => {
    dispatch(fetchLogs());
  }, [dispatch]);
  return {
    data: entries,
    isLoading,
    isError: !!error,
    error,
  };
}
