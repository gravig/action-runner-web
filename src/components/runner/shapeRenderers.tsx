/* eslint-disable react-refresh/only-export-components */
import type { ReactElement } from "react";
import type { ActionShape } from "../../types/actions";

// ─── Icons ────────────────────────────────────────────────────────────────────

type IconProps = { className?: string };

function iconCube({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      />
      <polyline
        strokeLinecap="round"
        strokeLinejoin="round"
        points="3.27 6.96 12 12.01 20.73 6.96"
      />
      <line strokeLinecap="round" x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function iconQuote({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"
      />
    </svg>
  );
}

function iconHash({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <line strokeLinecap="round" x1="4" y1="9" x2="20" y2="9" />
      <line strokeLinecap="round" x1="4" y1="15" x2="20" y2="15" />
      <line strokeLinecap="round" x1="10" y1="3" x2="8" y2="21" />
      <line strokeLinecap="round" x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function iconToggle({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <rect
        strokeLinecap="round"
        strokeLinejoin="round"
        x="1"
        y="5"
        width="22"
        height="14"
        rx="7"
      />
      <circle cx="16" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function iconJavascript({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 16v2m0-6v-2m0 6h6m-3-3h-6"
      />
    </svg>
  );
}

function iconSparkle({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
      />
    </svg>
  );
}

function iconPlay({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <polygon
        strokeLinecap="round"
        strokeLinejoin="round"
        points="5 3 19 12 5 21 5 3"
      />
    </svg>
  );
}

function iconList({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <line strokeLinecap="round" x1="8" y1="6" x2="21" y2="6" />
      <line strokeLinecap="round" x1="8" y1="12" x2="21" y2="12" />
      <line strokeLinecap="round" x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="3" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="3" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function iconDatabase({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <ellipse
        cx="12"
        cy="5"
        rx="9"
        ry="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 5v6c0 1.657-4.03 3-9 3S3 12.657 3 11V5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11v6c0 1.657-4.03 3-9 3S3 19.657 3 18v-6"
      />
    </svg>
  );
}

// ─── Renderer types ───────────────────────────────────────────────────────────

export const RENDERER_TYPES = [
  "SequenceAction",
  "CustomAction",
  "Action",
  "GenericDataset",
  "Dataset",
  "Literal",
  "Element",
] as const;

export type RendererType = (typeof RENDERER_TYPES)[number];

export type RendererConfig = {
  icon: (shape: ActionShape) => ReactElement;
  border: string;
  bg: string;
  iconColor: (shape: ActionShape) => string;
  badge: string;
  badgeText: string;
  label: (shape: ActionShape) => string;
};

const PRIMITIVE_VARIANTS: Record<
  string,
  { color: string; icon: (cls: string) => ReactElement }
> = {
  String: { color: "text-sky-400", icon: (c) => iconQuote({ className: c }) },
  Number: {
    color: "text-emerald-400",
    icon: (c) => iconHash({ className: c }),
  },
  Boolean: {
    color: "text-violet-400",
    icon: (c) => iconToggle({ className: c }),
  },
  Javascript: {
    color: "text-yellow-400",
    icon: (c) => iconJavascript({ className: c }),
  },
};

export const RENDERER_CONFIGS: Record<RendererType, RendererConfig> = {
  Element: {
    icon: () => iconCube({ className: "h-5 w-5" }),
    border: "border-slate-500/40",
    bg: "bg-slate-500/10",
    iconColor: () => "text-slate-400",
    badge: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
    badgeText: "Element",
    label: (s) => s.type[0],
  },
  Literal: {
    icon: (s) => {
      const variant = PRIMITIVE_VARIANTS[s.type[0]];
      const cls = `h-5 w-5 ${variant?.color ?? "text-sky-400"}`;
      return variant?.icon(cls) ?? iconHash({ className: cls });
    },
    border: "border-sky-500/40",
    bg: "bg-sky-500/10",
    iconColor: (s) => PRIMITIVE_VARIANTS[s.type[0]]?.color ?? "text-sky-400",
    badge: "bg-sky-500/20 text-sky-300 border border-sky-500/30",
    badgeText: "Literal",
    label: (s) => s.type[0],
  },
  GenericDataset: {
    icon: () => iconDatabase({ className: "h-5 w-5" }),
    border: "border-indigo-500/40",
    bg: "bg-indigo-500/10",
    iconColor: () => "text-indigo-400",
    badge: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
    badgeText: "GenericDataset",
    label: (s) => s.type[0],
  },
  Dataset: {
    icon: () => iconDatabase({ className: "h-5 w-5" }),
    border: "border-rose-500/40",
    bg: "bg-rose-500/10",
    iconColor: () => "text-rose-400",
    badge: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
    badgeText: "Dataset",
    label: (s) => s.type[0],
  },
  CustomAction: {
    icon: () => iconSparkle({ className: "h-5 w-5" }),
    border: "border-violet-500/40",
    bg: "bg-violet-500/10",
    iconColor: () => "text-violet-400",
    badge: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
    badgeText: "CustomAction",
    label: (s) => s.type[0],
  },
  Action: {
    icon: () => iconPlay({ className: "h-5 w-5" }),
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    iconColor: () => "text-amber-400",
    badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    badgeText: "Action",
    label: (s) => s.type[0],
  },
  SequenceAction: {
    icon: () => iconList({ className: "h-5 w-5" }),
    border: "border-teal-500/40",
    bg: "bg-teal-500/10",
    iconColor: () => "text-teal-400",
    badge: "bg-teal-500/20 text-teal-300 border border-teal-500/30",
    badgeText: "SequenceAction",
    label: (s) => s.type[0],
  },
};

export function resolveRenderer(typeArray: string[]): RendererType {
  for (const t of typeArray) {
    if ((RENDERER_TYPES as readonly string[]).includes(t)) {
      return t as RendererType;
    }
  }
  return "Element";
}
