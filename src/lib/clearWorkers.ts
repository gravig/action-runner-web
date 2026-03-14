/**
 * Unregisters all registered service workers and clears all caches, then
 * reloads the page so it starts fresh without any SW controller.
 *
 * Call this from the browser console whenever SWs stack up:
 *
 *   clearWorkers()
 */
export async function clearWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    console.warn("[clearWorkers] Service workers are not supported.");
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));

  const cacheKeys = await caches.keys();
  await Promise.all(cacheKeys.map((key) => caches.delete(key)));

  console.log(
    `[clearWorkers] Unregistered ${registrations.length} SW(s) and cleared ${cacheKeys.length} cache(s). Reloading…`,
  );

  window.location.reload();
}
