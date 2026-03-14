/**
 * Redux ↔ cross-tab bridge using BroadcastChannel.
 *
 * Runs in **window** context (not inside the SW).
 *
 * ### How it works
 * 1. `createBridgeMiddleware()` intercepts every Redux dispatch.
 *    - Serializable actions that aren't internal RTK Query bookkeeping are
 *      posted to a shared `BroadcastChannel`.
 *    - Actions received *from* the channel (marked `__bridge: true`) are let
 *      through without re-posting, preventing echo loops.
 *    - `BroadcastChannel` never echoes back to the sender, so the originating
 *      tab never sees its own messages.
 *
 * 2. `initBridge(dispatch)` opens the same channel and listens for messages
 *    posted by other tabs. Received actions are stamped `__bridge: true` and
 *    dispatched into the local store so RTK Query processes them — crucially,
 *    `util/invalidateTags` triggers an automatic refetch of active queries.
 *
 * ### Why BroadcastChannel over SW postMessage
 * SW-relayed messages require `navigator.serviceWorker.controller` to be
 * set (which has race conditions on first load / popup open) and add an async
 * hop through the SW. BroadcastChannel is synchronous, always available on
 * same-origin pages, and never echoes back to the sender.
 *
 * ### Actions that ARE relayed
 * - `util/invalidateTags` — direct cache invalidation (most important)
 * - Mutation lifecycle: `executeMutation/fulfilled`, `/rejected`, `/pending`
 * - `resetApiState`
 *
 * ### Actions that are NOT relayed
 * - RTK Query subscription management (`/Subscriptions`, `middlewareRegistered`)
 * - Redux internal actions (`@@redux/…`, `@@INIT`)
 * - Non-serializable actions (contain functions, Symbols, circular refs, etc.)
 */

import type { Middleware } from "@reduxjs/toolkit";

const CHANNEL_NAME = "redux-bridge";
const BRIDGE_KEY = "__bridge";

/** Action type substrings that are internal RTK Query bookkeeping — skip. */
const SKIP_PATTERNS = [
  "/Subscriptions",
  "middlewareRegistered",
  "@@redux",
  "@@INIT",
  "subscriptionsUpdated",
];

/**
 * RTK Query's `fetchBaseQuery` attaches the raw `Response` object to
 * `meta.baseQueryMeta` on fulfilled/rejected mutation actions. Strip it before
 * the serialization check so the action is not incorrectly rejected as
 * non-serializable.
 */
function sanitizeForRelay(
  action: Record<string, unknown>,
): Record<string, unknown> {
  const meta = action["meta"];
  if (meta && typeof meta === "object" && "baseQueryMeta" in (meta as object)) {
    return {
      ...action,
      meta: Object.fromEntries(
        Object.entries(meta as Record<string, unknown>).filter(
          ([k]) => k !== "baseQueryMeta",
        ),
      ),
    };
  }
  return action;
}

function shouldRelay(action: unknown): boolean {
  if (typeof action !== "object" || action === null) return false;
  if ((action as Record<string, unknown>)[BRIDGE_KEY]) return false;

  const type =
    typeof (action as Record<string, unknown>)["type"] === "string"
      ? ((action as Record<string, unknown>)["type"] as string)
      : "";

  if (!type) return false;
  if (SKIP_PATTERNS.some((p) => type.includes(p))) return false;

  try {
    JSON.stringify(sanitizeForRelay(action as Record<string, unknown>));
    return true;
  } catch {
    return false;
  }
}

/** Lazily created BroadcastChannel shared between middleware and listener. */
let _channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!_channel) _channel = new BroadcastChannel(CHANNEL_NAME);
  return _channel;
}

/**
 * Redux middleware — add to your store's middleware chain.
 * Posts qualifying actions to all other same-origin tabs/windows via
 * BroadcastChannel.
 */
export function createBridgeMiddleware(): Middleware {
  return () => (next) => (action) => {
    const result = next(action);

    if (shouldRelay(action)) {
      const ch = getChannel();
      ch?.postMessage(sanitizeForRelay(action as Record<string, unknown>));
    }

    return result;
  };
}

/**
 * Start listening for relayed actions from other tabs.
 * Call once after the Redux store is ready.
 *
 * @returns A cleanup function that closes the channel listener.
 */
export function initBridge(dispatch: (action: unknown) => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const handler = (event: MessageEvent<unknown>) => {
    if (!event.data || typeof event.data !== "object") return;
    // Stamp the action so the middleware skips re-broadcasting it.
    dispatch({ ...(event.data as object), [BRIDGE_KEY]: true });
  };

  ch.addEventListener("message", handler);
  return () => ch.removeEventListener("message", handler);
}
