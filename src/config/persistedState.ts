/**
 * Central registry of all persisted UI state entries.
 *
 * Each key maps to its metadata. The key is used directly as the
 * localStorage key, so keep them stable — renaming a key resets that setting
 * for all users.
 *
 * Add a new entry here whenever a piece of UI state should survive page
 * reloads. The `useLocalStorage` hook enforces that only keys listed here
 * can be persisted.
 */
export const PERSISTED_STATE_CONFIG = {
  // ── Actions page – shape-group collapsibles ──────────────────────────────
  "actions.group.SequenceAction": {
    defaultValue: true,
    description: "Actions page: SequenceAction group expanded",
  },
  "actions.group.CustomAction": {
    defaultValue: true,
    description: "Actions page: CustomAction group expanded",
  },
  "actions.group.Action": {
    defaultValue: true,
    description: "Actions page: Action group expanded",
  },
  "actions.group.GenericDataset": {
    defaultValue: true,
    description: "Actions page: GenericDataset group expanded",
  },
  "actions.group.Dataset": {
    defaultValue: true,
    description: "Actions page: Dataset group expanded",
  },
  "actions.group.Literal": {
    defaultValue: true,
    description: "Actions page: Literal group expanded",
  },
  "actions.group.Element": {
    defaultValue: true,
    description: "Actions page: Element group expanded",
  },
  // ── Actions page – shape-group order ─────────────────────────────────────
  "actions.groups.order": {
    defaultValue: [] as string[],
    description:
      "Actions page: ordered list of RendererType keys (empty = default order)",
  },
  // ── Workspace – flexlayout model ─────────────────────────────────────────
  "workspace.layout": {
    defaultValue: null as unknown,
    description:
      "Workspace page: serialised flexlayout-react model JSON (sizes, positions, open tabs)",
  },
} as const satisfies Record<
  string,
  { defaultValue: unknown; description: string }
>;

export type PersistedStateKey = keyof typeof PERSISTED_STATE_CONFIG;
