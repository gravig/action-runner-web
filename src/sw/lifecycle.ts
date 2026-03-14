/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

import { CACHE_NAME } from "./config";

/**
 * Install handler — skip the waiting phase so the new worker takes control
 * immediately without requiring existing tabs to be closed first.
 */
export function registerLifecycle(): void {
  self.addEventListener("install", (event: ExtendableEvent) => {
    event.waitUntil(self.skipWaiting());
  });

  self.addEventListener("activate", (event: ExtendableEvent) => {
    event.waitUntil(
      (async () => {
        // Remove stale caches from previous versions.
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        );
        // Claim all open clients so the new worker controls them immediately.
        await self.clients.claim();
      })(),
    );
  });
}
