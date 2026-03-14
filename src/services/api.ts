/**
 * Centralised API path constants.
 *
 * The backend exposes three path prefixes:
 *   /admin/*   – privileged routes (action runner, datasets, shapes)
 *   /worker/*  – worker-node routes (logs, products, WebSocket streams)
 *   /public/*  – unauthenticated routes (search)
 */

// In development the Vite dev-server proxies /admin, /worker, /public and
// /auth to the backend, so relative URLs suffice and CORS never fires.
// In production (or when VITE_API_BASE is set) we still build absolute URLs.
const _host =
  typeof window !== "undefined" ? window.location.hostname : "localhost";

const HTTP_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  (import.meta.env.DEV ? "" : `http://${_host}:8000`);
const WS_BASE =
  (import.meta.env.VITE_WS_BASE as string | undefined) ?? `ws://${_host}:8000`;

export const ADMIN_BASE = `${HTTP_BASE}/admin`;
export const WORKER_BASE = `${ADMIN_BASE}/workers`;
export const PUBLIC_BASE = `${HTTP_BASE}/public`;

// ── Admin routes ──────────────────────────────────────────────────────────────
export const API = {
  // Health
  health: `${HTTP_BASE}/health`,

  // Admin – runner
  adminRun: `${ADMIN_BASE}/run`,
  adminActionContext: `${ADMIN_BASE}/action/context`,

  // Admin – shapes
  adminActionShapes: `${ADMIN_BASE}/actions/shapes`,
  adminActionsCustom: `${ADMIN_BASE}/actions/custom`,
  adminActionsCustomByName: (name: string) =>
    `${ADMIN_BASE}/actions/custom/${encodeURIComponent(name)}`,
  adminActionsMigros: `${ADMIN_BASE}/actions/migros`,

  // Admin – datasets
  adminDatasets: `${ADMIN_BASE}/datasets`,
  adminDatasetsMetrics: `${ADMIN_BASE}/datasets/metrics`,
  adminDatasetByName: (name: string) =>
    `${ADMIN_BASE}/datasets/${encodeURIComponent(name)}`,

  // Admin – workers
  adminWorkersStream: `${WS_BASE}/admin/workers/stream`,
  adminWorkersLogs: `${WS_BASE}/admin/workers/logs`,

  // Auth
  authToken: `${HTTP_BASE}/auth/token`,

  // Worker – HTTP
  workerLogs: `${WORKER_BASE}/logs`,

  // Worker – WebSocket
  workerWs: (channel: string) =>
    `${WS_BASE}/admin/workers/${encodeURIComponent(channel)}`,

  // Public
  publicSearch: `${PUBLIC_BASE}/search`,
} as const;

// ── Auth helpers ──────────────────────────────────────────────────────────────

export const TOKEN_KEY = "auth_token";

/**
 * Drop-in replacement for `fetch` that automatically injects
 * `Authorization: Bearer <token>` from localStorage when a token is present.
 * Throws on non-OK responses.
 */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
