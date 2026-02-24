import { useCallback, useState } from "react";
import {
  PERSISTED_STATE_CONFIG,
  type PersistedStateKey,
} from "../config/persistedState";

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

/**
 * Like `useState<T>`, but the value is persisted in localStorage.
 *
 * The `key` must be registered in `src/config/persistedState.ts`.
 * The stored value is read once on mount; the default from the config is used
 * when no stored value exists yet.
 *
 * @returns `[value, setValue]` — same shape as `useState`
 */
export function useLocalStorage<T>(key: PersistedStateKey): [T, SetValue<T>] {
  const defaultValue = PERSISTED_STATE_CONFIG[key].defaultValue as T;

  const [value, setRaw] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue: SetValue<T> = useCallback(
    (update) => {
      setRaw((prev) => {
        const next =
          typeof update === "function"
            ? (update as (prev: T) => T)(prev)
            : update;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // localStorage may be unavailable (private browsing quota, etc.)
        }
        return next;
      });
    },
    [key],
  );

  return [value, setValue];
}
