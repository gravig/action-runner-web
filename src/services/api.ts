/**
 * Centralised API path constants.
 *
 * The backend exposes three path prefixes:
 *   /admin/*   – privileged routes (action runner, datasets, shapes)
 *   /worker/*  – worker-node routes (logs, products, WebSocket streams)
 *   /public/*  – unauthenticated routes (search)
 */

declare global {
  interface Window {
    Config: {
      target: {
        api: {
          protocol: string;
          host: string;
          port: number;
        };
      };
    };
  }
  const Config: Window["Config"];
}

function createUrl({
  protocol,
  host,
  port,
}: Window["Config"]["target"]["api"]) {
  if (port === 80 || port === 443) {
    return `${protocol}://${host}`;
  }
  return `${protocol}://${host}:${port}`;
}

const API_URL_BASE = createUrl(Config.target.api);
const WS_BASE = API_URL_BASE.replace(/^http/, "ws");

export const ADMIN_BASE = `${API_URL_BASE}/admin`;
export const WORKER_BASE = `${ADMIN_BASE}/workers`;
export const PUBLIC_BASE = `${API_URL_BASE}/public`;

// ── Admin routes ──────────────────────────────────────────────────────────────
export const API = {
  // Health
  health: `${API_URL_BASE}/health`,

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
  authToken: `${API_URL_BASE}/auth/token`,

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
