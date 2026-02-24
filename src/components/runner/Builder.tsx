import type { ActionShape } from "../../types/actions";
import type { SlotValue } from "../../types/builder";
import { Slot } from "./Slot";

type Props = {
  shapes: ActionShape[];
  value: SlotValue | null;
  onChange: (v: SlotValue | null) => void;
};

export function Builder({ shapes, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Builder
          </p>
          <h2 className="text-sm font-semibold text-white">
            Compose an action
          </h2>
        </div>
        {value && (
          <button
            onClick={() => onChange(null)}
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 transition hover:border-white/20 hover:text-slate-200"
          >
            Reset
          </button>
        )}
      </div>

      {/* Root slot – accepts Actions (and plain Elements as fallback) */}
      <Slot
        shapes={shapes}
        accepts={["Action", "Element"]}
        label="Action"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
