import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
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

export const logsApi = createApi({
  reducerPath: "logsApi",
  baseQuery: fetchBaseQuery({ baseUrl: WORKER_BASE }),
  endpoints: (builder) => ({
    getLogs: builder.query<LogEntry[], void>({
      query: () => "/logs",
      transformResponse: (response: LogsResponse) =>
        parseLogContent(response.content),
    }),
  }),
});

export const { useGetLogsQuery } = logsApi;
