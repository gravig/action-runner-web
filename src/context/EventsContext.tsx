import { createContext, useContext } from "react";
import type { EventEmitter } from "../lib/EventEmitter";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyEmitter = EventEmitter<any>;

const EventsContext = createContext<AnyEmitter | null>(null);

/** Provider used internally by the module system. */
export const EventsProvider = EventsContext.Provider;

/**
 * Returns the {@link EventEmitter} bound to the current module.
 *
 * Cast to the specific event map at the call site:
 * ```ts
 * import type { ActionShape } from "../types/actions";
 *
 * const events = useEvents<{ onSelectElement: ActionShape }>();
 * events.emit("onSelectElement", shape);
 * ```
 *
 * Throws if called outside a module that declared `events`.
 */
export function useEvents<
  T extends Record<string, unknown>,
>(): EventEmitter<T> {
  const emitter = useContext(EventsContext);
  if (!emitter) {
    throw new Error(
      "useEvents() must be called inside a module component whose @Module class declares an `events` property.",
    );
  }
  return emitter as EventEmitter<T>;
}
