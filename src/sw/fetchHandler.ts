/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

import { CACHE_NAME } from "./config";

/**
 * Fetch handler.
 *
 * In development the SW must not intercept any requests — Vite's optimized
 * deps use a ?v= cache-busting hash that changes on every rebuild. If the SW
 * caches those URLs (even once) and Vite later invalidates them, every
 * request for the old hash gets a 504 "Outdated Optimize Dep" from Vite's
 * dev server until the cache is manually cleared.
 *
 * In production:
 * - **Navigation requests** (HTML): network-first so the SPA shell stays
 *   up-to-date; falls back to cache when offline.
 * - **Static assets**: cache-first — serves from cache instantly when
 *   available; populates the cache on first fetch.
 */
export function registerFetchHandler(): void {
  self.addEventListener("fetch", (event: FetchEvent) => {
    // Hands-off in dev — let the browser handle everything natively.
    if (import.meta.env.DEV) return;

    const { request } = event;

    // Ignore cross-origin requests.
    if (!request.url.startsWith(self.location.origin)) return;

    if (request.mode === "navigate") {
      event.respondWith(
        fetch(request).catch(async () => {
          const cached = await caches.match(request);
          return cached ?? Response.error();
        }),
      );
      return;
    }

    // Cache-first for static assets.
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        // Only store successful, same-origin responses.
        if (response.ok && response.type === "basic") {
          cache.put(request, response.clone());
        }
        return response;
      }),
    );
  });
}
