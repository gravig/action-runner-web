import { ShapeCardCompact } from "../../ShapeCard";
import { registerEnhancer } from "./registry";
import type { EnhancerProps } from "./types";

/**
 * Enhancer for CustomAction shapes.
 *
 * Reads the `payload` field from the shape definition and renders a compact
 * preview of the inner action above the standard slot form, so the user can
 * immediately see which action is wrapped by this custom action.
 */
export function CustomActionEnhancer({ value, children }: EnhancerProps) {
  const payload = value.shape.payload;

  return (
    <div className="flex flex-col gap-3">
      {payload && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Payload
          </p>
          <ShapeCardCompact shape={payload} />
        </div>
      )}
      {children}
    </div>
  );
}

registerEnhancer("CustomAction", CustomActionEnhancer);
