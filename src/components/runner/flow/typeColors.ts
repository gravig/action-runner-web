import { resolveRenderer } from "../shapeRenderers";

export interface TypeColor {
  fill: string;
  border: string;
  text: string;
  bg: string;
}

/**
 * Map a shape type[] (or param type[]) to a colour token set used for
 * handle fills, param labels and edge strokes.
 */
export function typeArrayColor(types: string[]): TypeColor {
  // Literal primitives – checked first (they are also tagged "Literal")
  if (types.includes("String"))
    return {
      fill: "#38bdf8",
      border: "#0ea5e9",
      text: "text-sky-400",
      bg: "bg-sky-500/15",
    };
  if (types.includes("Number"))
    return {
      fill: "#34d399",
      border: "#10b981",
      text: "text-emerald-400",
      bg: "bg-emerald-500/15",
    };
  if (types.includes("Boolean"))
    return {
      fill: "#c084fc",
      border: "#a855f7",
      text: "text-purple-400",
      bg: "bg-purple-500/15",
    };
  if (types.includes("Javascript"))
    return {
      fill: "#facc15",
      border: "#eab308",
      text: "text-yellow-400",
      bg: "bg-yellow-500/15",
    };

  // Structural renderer types
  const r = resolveRenderer(types);
  switch (r) {
    case "SequenceAction":
      return {
        fill: "#2dd4bf",
        border: "#14b8a6",
        text: "text-teal-400",
        bg: "bg-teal-500/15",
      };
    case "CustomAction":
      return {
        fill: "#a78bfa",
        border: "#8b5cf6",
        text: "text-violet-400",
        bg: "bg-violet-500/15",
      };
    case "Action":
      return {
        fill: "#fbbf24",
        border: "#f59e0b",
        text: "text-amber-400",
        bg: "bg-amber-500/15",
      };
    case "GenericDataset":
      return {
        fill: "#818cf8",
        border: "#6366f1",
        text: "text-indigo-400",
        bg: "bg-indigo-500/15",
      };
    case "Dataset":
      return {
        fill: "#fb7185",
        border: "#f43f5e",
        text: "text-rose-400",
        bg: "bg-rose-500/15",
      };
    case "Literal":
      return {
        fill: "#38bdf8",
        border: "#0ea5e9",
        text: "text-sky-400",
        bg: "bg-sky-500/15",
      };
    default:
      return {
        fill: "#94a3b8",
        border: "#64748b",
        text: "text-slate-400",
        bg: "bg-slate-500/15",
      };
  }
}
