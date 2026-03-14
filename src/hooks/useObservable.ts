import { useCallback, useSyncExternalStore } from "react";
import type { Observable } from "../lib/Observable";

/**
 * Subscribe to an {@link Observable} and return its current value.
 * The host component re-renders whenever the observable emits a new value.
 *
 * @example
 * ```tsx
 * const count = useObservable(counterObs); // re-renders on every emit
 * ```
 */
export function useObservable<T>(observable: Observable<T>): T {
  return useSyncExternalStore(
    useCallback(
      (notify: () => void) => {
        // useSyncExternalStore's subscribe callback just signals "something
        // changed" – it doesn't receive the value, so we wrap it.
        const sub = (_: T) => notify();
        observable.subscribe(sub);
        return () => observable.unsubscribe(sub);
      },
      [observable],
    ),
    () => observable.get(),
  );
}

/**
 * Returns the current subscriber count of an {@link Observable} and
 * re-renders the host component whenever the count changes (i.e. after every
 * `subscribe` / `unsubscribe` call on that observable).
 *
 * Useful for conditionally rendering UI that only makes sense when at least
 * one external listener is attached.
 *
 * @example
 * ```tsx
 * const count = useSubscriberCount(events.observable("onSelectElement"));
 * if (count === 0) return null; // no one listening – hide the button
 * ```
 */
export function useSubscriberCount<T>(observable: Observable<T>): number {
  return useSyncExternalStore(
    useCallback(
      (notify: () => void) => observable.onSubscriptionChanged(notify),
      [observable],
    ),
    () => observable.subscriberCount,
  );
}
