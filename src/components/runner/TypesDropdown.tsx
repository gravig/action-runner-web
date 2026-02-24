import { useEffect, useRef, useState } from "react";
import type { ActionShape } from "../../types/actions";
import { ShapeCardCompact } from "./ShapeCard";

type Props = {
  shapes: ActionShape[];
};

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.2}
    >
      <polyline
        strokeLinecap="round"
        strokeLinejoin="round"
        points="6 9 12 15 18 9"
      />
    </svg>
  );
}

export function TypesDropdown({ shapes }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/12 hover:text-white"
      >
        Types
        <IconChevron open={open} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/15 bg-[#0c1220]/95 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Available types
            </span>
            <span className="text-[10px] text-slate-500">{shapes.length}</span>
          </div>
          <div className="flex flex-col gap-1 p-2 max-h-[420px] overflow-auto">
            {shapes.map((shape) => (
              <ShapeCardCompact key={shape.type[0]} shape={shape} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
