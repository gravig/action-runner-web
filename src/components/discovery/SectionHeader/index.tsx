import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  count: number;
  accentClass: string;
};

export function SectionHeader({ icon, label, count, accentClass }: Props) {
  return (
    <div className="flex items-center gap-2 border-b border-white/[0.05] px-4 py-2.5">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-md ${accentClass}`}
      >
        {icon}
      </span>
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">
        {label}
      </span>
      <span className="ml-auto rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] font-semibold text-slate-500">
        {count}
      </span>
    </div>
  );
}
