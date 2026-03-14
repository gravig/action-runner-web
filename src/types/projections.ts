/**
 * Types mirroring the backend projection API.
 *
 * The backend returns projections as a collection of generic "BackendComponent"
 * descriptors — each has a `type` (a string key that maps to a web-component in
 * the frontend registry) and an opaque `props` bag.
 */

import type { SlotValue } from "./builder";

/** A single UI component descriptor coming from the backend. */
export type BackendComponent = {
  /** Maps to a registered web-component key, e.g. "BarChart". */
  type: string;
  /** Component-specific configuration; the shape depends on `type`. */
  props: Record<string, unknown>;
};

/** Lightweight projection entry returned by GET /admin/projections. */
export type ProjectionSummary = {
  id: string;
  title: string;
};

/** Full projection returned by GET /admin/projections/{id}. */
export type Projection = {
  id: string;
  title: string;
  web_components: BackendComponent[];
};

/** Shape of GET /admin/projections list response. */
export type ProjectionListResponse = {
  count: number;
  projections: ProjectionSummary[];
};

// ─── Editor types ─────────────────────────────────────────────────────────────
// These live only in the frontend. They drive the projection editor UI.

/** Whether a component prop is a hardcoded literal or resolved via an action. */
export type PropMode = "static" | "action";

/**
 * An editable representation of a single component prop.
 * - `static` mode: the user enters raw JSON; serialised as-is to the backend.
 * - `action` mode: the user composes a Slot; serialised as
 *   `{ __action: <serialised slot>, __result_key: "result" }`.
 */
export type EditablePropValue = {
  mode: PropMode;
  /** Raw JSON string used in static mode. */
  staticValue: string;
  /** SlotValue used in action mode. */
  actionValue: SlotValue | null;
};

/** Editable representation of a single web-component inside a projection. */
export type EditableComponent = {
  type: string;
  props: Record<string, EditablePropValue>;
};

/** Full editable projection state (used by ProjectionEditor). */
export type EditableProjection = {
  /** Undefined when creating a new projection. */
  id?: string;
  title: string;
  components: EditableComponent[];
};
