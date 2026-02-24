import type { ActionShape } from "./actions";

export type SlotValue = {
  type: string[];
  shape: ActionShape;
  value?: string | boolean;
  params?: Record<string, SlotValue | null>;
};
