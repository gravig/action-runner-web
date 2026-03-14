import { Handle, Position } from "@xyflow/react";

/**
 * Special "Start" node — marks the entry point of serialization.
 * Connect its source handle to any ShapeNode's root handle (▲ at top)
 * to tell the serializer which action is the root of the chain.
 */
export function StartNode() {
  return (
    <div
      className="relative flex items-center gap-2.5 rounded-full border border-lime-500/60 bg-lime-500/12 px-5 py-2.5 shadow-lg shadow-lime-500/10 backdrop-blur-sm"
      style={{ minWidth: 110 }}
    >
      {/* Play icon */}
      <svg
        className="w-3.5 h-3.5 text-lime-400 shrink-0"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>

      <span className="text-[11px] font-bold text-lime-300 uppercase tracking-widest select-none">
        Start
      </span>

      {/* Source handle — drag from here to a shape node's root handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="start-out"
        style={{
          right: -6,
          width: 12,
          height: 12,
          background: "#86efac",
          borderColor: "#22c55e",
          borderWidth: 2,
          borderRadius: "50%",
          cursor: "crosshair",
        }}
      />
    </div>
  );
}
