import type { ActionShape } from "../../../types/actions";
import { ShapeCardCompact } from "../ShapeCard";
import {
  resolveRenderer,
  RENDERER_TYPES,
  RENDERER_CONFIGS,
} from "../shapeRenderers";
import type { RendererType } from "../shapeRenderers";

function groupShapes(
  shapes: ActionShape[],
): { rendererType: RendererType; shapes: ActionShape[] }[] {
  const map = new Map<RendererType, ActionShape[]>();
  for (const shape of shapes) {
    const rt = resolveRenderer(shape.type);
    if (!map.has(rt)) map.set(rt, []);
    map.get(rt)!.push(shape);
  }
  return RENDERER_TYPES.map((rt) => ({
    rendererType: rt,
    shapes: map.get(rt) ?? [],
  })).filter((g) => g.shapes.length > 0);
}

export function ShapeSelectDropdown({
  shapes,
  onSelect,
}: {
  shapes: ActionShape[];
  onSelect: (s: ActionShape) => void;
}) {
  const groups = groupShapes(shapes);

  return (
    <div className="absolute left-0 top-full z-50 mt-1.5 w-[28rem] min-w-[22rem] rounded-xl border border-white/15 bg-[#0b1120] shadow-2xl">
      <div className="px-3 py-2 border-b border-white/10">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Select type
        </span>
      </div>
      {shapes.length === 0 ? (
        <p className="px-3 py-3 text-xs text-slate-500">No compatible types</p>
      ) : (
        <div className="flex flex-col overflow-auto max-h-72">
          {groups.map(({ rendererType, shapes: groupItems }, gi) => {
            const cfg = RENDERER_CONFIGS[rendererType];
            // iconColor takes a shape but only uses static values — pass a dummy
            const dummyShape: ActionShape = { type: [], callable: false };
            return (
              <div
                key={rendererType}
                className={gi > 0 ? "border-t border-white/5" : ""}
              >
                <div className="px-3 py-1.5">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest ${cfg.iconColor(
                      dummyShape,
                    )}`}
                  >
                    {cfg.badgeText}s
                  </span>
                </div>
                <div className="flex flex-col gap-1 px-2 pb-2">
                  {groupItems.map((s) => (
                    <button
                      key={s.type[0]}
                      onClick={() => onSelect(s)}
                      className="text-left transition hover:opacity-80"
                    >
                      <ShapeCardCompact shape={s} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
