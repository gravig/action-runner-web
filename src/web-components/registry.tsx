/**
 * Web-component registry.
 *
 * Each entry maps the backend `type` string (from a BackendComponent) to:
 *   - The React component to render
 *   - Its declaration (name + props type stub) for documentation / type safety
 *
 * To add a new web-component:
 *   1. Create `src/web-components/<Name>/index.tsx` and export a `declaration`
 *      object plus the React component.
 *   2. Import them here and add an entry to `WEB_COMPONENT_REGISTRY`.
 */

import type React from "react";
import type { BackendComponent } from "../types/projections";
import {
  BarChart,
  declaration as barChartDeclaration,
  propDefs as barChartPropDefs,
} from "./BarChart";
import {
  CandleChart,
  declaration as candleChartDeclaration,
  propDefs as candleChartPropDefs,
} from "./CandleChart";

// ─── Registry entry type ──────────────────────────────────────────────────────

export type WebComponentDeclaration = {
  /** The backend `type` key, e.g. "BarChart". */
  name: string;
  /** Props type stub — used for documentation; the actual shape is per-component. */
  props: Record<string, unknown>;
};

/** Describes a single configurable prop for the projection editor. */
export type PropDef = {
  name: string;
  required: boolean;
  description?: string;
  /** If true the editor offers an "Action" mode (slot picker) in addition to static JSON. */
  supportsAction: boolean;
  /** Default value shown in the static JSON editor when the prop is first added. */
  defaultStatic: string;
};

export type WebComponentEntry = {
  declaration: WebComponentDeclaration;
  propDefs: readonly PropDef[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>;
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const WEB_COMPONENT_REGISTRY: Record<string, WebComponentEntry> = {
  BarChart: {
    declaration: barChartDeclaration,
    propDefs: barChartPropDefs,
    Component: BarChart,
  },
  CandleChart: {
    declaration: candleChartDeclaration,
    propDefs: candleChartPropDefs,
    Component: CandleChart,
  },
};

// ─── Renderer ─────────────────────────────────────────────────────────────────

/**
 * Resolves and renders a single BackendComponent using the registry.
 * Returns null (with a console warning) when the type is not registered.
 */
export function renderBackendComponent(
  bc: BackendComponent,
  key: string | number,
): React.ReactNode {
  const entry = WEB_COMPONENT_REGISTRY[bc.type];
  if (!entry) {
    console.warn(`[web-components] Unknown component type: "${bc.type}"`);
    return (
      <div
        key={key}
        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400"
      >
        Unknown component: <code>{bc.type}</code>
      </div>
    );
  }
  const { Component } = entry;
  return <Component key={key} {...bc.props} />;
}
