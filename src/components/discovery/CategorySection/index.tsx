import type { CategoryResult } from "../../../services/searchApi";
import { SectionHeader } from "../SectionHeader";
import { ScoreBadge } from "../ScoreBadge";
import { IconTag } from "../Icons";

type Props = { categories: CategoryResult[] };

export function CategorySection({ categories }: Props) {
  return (
    <div>
      <SectionHeader
        icon={<IconTag className="h-3.5 w-3.5" />}
        label="Categories"
        count={categories.length}
        accentClass="bg-violet-500/20 text-violet-400"
      />
      <div className="overflow-x-auto px-4 py-3 [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.1]">
        <div
          className="grid gap-2"
          style={{
            gridTemplateRows: "repeat(2, auto)",
            gridAutoFlow: "column",
            gridAutoColumns: "220px",
          }}
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-2.5 rounded-lg border border-white/[0.05] bg-white/[0.03] px-3 py-2.5 transition hover:border-violet-400/20 hover:bg-violet-500/[0.04]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                <IconTag className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium leading-snug text-white">
                  {cat.values.name}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <ScoreBadge score={cat.score} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
