import type { ActionShape } from "../../../types/actions";
import type { SlotValue } from "../../../types/builder";

// ─── matchesAccepts ───────────────────────────────────────────────────────────
// Returns true if shape.type ends with the accepts array (all elements in order).

export function matchesAccepts(shape: ActionShape, accepts: string[]) {
  const t = shape.type;
  if (t.length < accepts.length) return false;
  for (let i = 1; i <= accepts.length; ++i) {
    if (t[t.length - i] !== accepts[accepts.length - i]) return false;
  }
  return true;
}

// ─── PRIMITIVE_SHAPES ─────────────────────────────────────────────────────────
// The API only returns callable action shapes. Primitive leaf types need
// synthetic entries so they appear as selectable options in the slot dropdown.

export const PRIMITIVE_SHAPES: ActionShape[] = [
  { type: ["Javascript", "String", "Literal", "Element"], callable: false },
  { type: ["String", "Literal", "Element"], callable: false },
  { type: ["Number", "Literal", "Element"], callable: false },
  { type: ["Boolean", "Literal", "Element"], callable: false },
];

// ─── initSlotValue ────────────────────────────────────────────────────────────

export function initSlotValue(shape: ActionShape): SlotValue {
  if (shape.callable) {
    const params: Record<string, SlotValue | null> = {};
    for (const p of shape.params ?? []) params[p.name] = null;
    return { type: shape.type, shape, params };
  }
  if (shape.type[0] === "Boolean")
    return { type: shape.type, shape, value: false };
  return { type: shape.type, shape, value: "" };
}

// ─── serializeSlot ────────────────────────────────────────────────────────────

export function serializeSlot(val: SlotValue): unknown {
  if (val.params !== undefined) {
    return {
      type: val.type,
      params: Object.fromEntries(
        Object.entries(val.params).map(([k, v]) => [
          k,
          v ? serializeSlot(v) : null,
        ]),
      ),
    };
  }
  return { type: val.type, value: val.value };
}

// ─── deserializeSlot ──────────────────────────────────────────────────────────
// Reconstructs a SlotValue tree from a serialized payload + the live shapes
// list. Unknown type names are silently skipped (param set to null).

export function deserializeSlot(
  raw: unknown,
  shapes: ActionShape[],
): SlotValue | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as {
    type?: string[];
    params?: Record<string, unknown>;
    value?: unknown;
  };
  if (!r.type?.length) return null;

  const allShapes = [...PRIMITIVE_SHAPES, ...shapes];
  const shape = allShapes.find((s) => s.type[0] === r.type![0]);
  if (!shape) return null;

  if (r.params !== undefined) {
    const params: Record<string, SlotValue | null> = {};
    for (const p of shape.params ?? []) {
      const rawParam = r.params[p.name];
      params[p.name] = rawParam ? deserializeSlot(rawParam, shapes) : null;
    }
    return { type: r.type, shape, params };
  }

  return {
    type: r.type,
    shape,
    value: r.value as string | boolean | undefined,
  };
}
