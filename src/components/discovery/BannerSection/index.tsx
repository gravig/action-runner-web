import type { BannerResult } from "../../../services/searchApi";
import { SectionHeader } from "../SectionHeader";
import { ScoreBadge } from "../ScoreBadge";
import { IconStore } from "../Icons";

type Props = { banners: BannerResult[] };

export function BannerSection({ banners }: Props) {
  return (
    <div>
      <SectionHeader
        icon={<IconStore className="h-3.5 w-3.5" />}
        label="Banners"
        count={banners.length}
        accentClass="bg-amber-500/20 text-amber-400"
      />
      <div className="flex flex-col gap-2 px-4 py-3">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.03] px-3 py-2.5 transition hover:border-amber-400/20 hover:bg-amber-500/[0.04]"
          >
            {banner.values.logo_url ? (
              <img
                src={banner.values.logo_url}
                alt={banner.values.name}
                className="h-8 w-8 shrink-0 rounded-md object-contain"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
                <IconStore className="h-4 w-4" />
              </span>
            )}
            <span className="text-sm font-medium text-white">
              {banner.values.name}
            </span>
            <ScoreBadge score={banner.score} />
          </div>
        ))}
      </div>
    </div>
  );
}
