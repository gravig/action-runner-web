import type { ComponentType } from "react";
import type { AnyEmitter } from "../context/EventsContext";

/**
 * The shape that every class decorated with @Module must satisfy.
 * `render` holds the React component mounted inside the workspace tab.
 * `events` (optional) is the EventEmitter made available inside the
 * component via `useEvents()`.
 */
export interface IModule {
  readonly render: ComponentType;
  readonly events?: AnyEmitter;
}

/**
 * Immutable record stored in ModuleContainer for each registered module.
 */
export interface ModuleDef {
  /** Unique id that matches the flexlayout `component` key for this tab. */
  readonly id: string;
  /** Human-readable display name shown in tab headers etc. */
  readonly name: string;
  /** The React component to render inside the workspace tab. */
  readonly component: ComponentType;
  /** Optional EventEmitter provided to the component via `useEvents()`. */
  readonly events?: AnyEmitter;
  /**
   * Which panel in the workspace layout this tab belongs to.
   * - `"main"` — the large central tabset (default)
   * - `"sidebar"` — the narrower right-hand column
   * - `"page"` — a top-level route, not a workspace tab
   */
  readonly panel: "main" | "sidebar" | "page";
  /**
   * URL path for `panel: "page"` modules (e.g. `"/workspace"`).
   * Ignored for tab modules.
   */
  readonly route?: string;
  /**
   * When `true` the page renders full-screen without the BaseLayout shell.
   * Only relevant for `panel: "page"` modules.
   */
  readonly fullPage?: boolean;
  /** Optional icon component shown alongside the tab name (future use). */
  readonly icon?: ComponentType;
  /** Optional tags used for search / discoverability (future use). */
  readonly tags?: readonly string[];
}
