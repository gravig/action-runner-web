/**
 * Centralised API path constants.
 *
 * The backend exposes three path prefixes:
 *   /admin/*   – privileged routes (action runner, datasets, shapes)
 *   /worker/*  – worker-node routes (logs, products, WebSocket streams)
 *   /public/*  – unauthenticated routes (search)
 */

const HTTP_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8000";
const WS_BASE =
  (import.meta.env.VITE_WS_BASE as string | undefined) ?? "ws://localhost:8000";

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

  // Worker – HTTP
  workerLogs: `${WORKER_BASE}/logs`,
  workerProducts: `${WORKER_BASE}/products`,

  // Worker – WebSocket
  workerWsProducts: `${WS_BASE}/admin/workers/products`,
  workerWs: (channel: string) =>
    `${WS_BASE}/admin/workers/${encodeURIComponent(channel)}`,

  // Public
  publicSearch: `${PUBLIC_BASE}/search`,
} as const;
