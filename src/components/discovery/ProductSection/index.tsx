import type { ProductResult, BannerResult } from "../../../services/searchApi";
import { SectionHeader } from "../SectionHeader";
import { ScoreBadge } from "../ScoreBadge";
import { IconShoppingBag, IconImagePlaceholder } from "../Icons";

type Props = {
  products: ProductResult[];
  banners: BannerResult[];
};

export function ProductSection({ products, banners }: Props) {
  const topBanner = banners[0] ?? null;

  return (
    <div>
      <SectionHeader
        icon={<IconShoppingBag className="h-3.5 w-3.5" />}
        label="Products"
        count={products.length}
        accentClass="bg-lagoon/20 text-lagoon"
      />
      <div className="overflow-x-auto px-4 py-3 [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.1]">
        <div className="flex gap-3" style={{ width: "max-content" }}>
          {products.map((product) => (
            <a
              key={product.id}
              href={product.values.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-[148px] shrink-0 flex-col overflow-hidden rounded-lg border border-white/[0.05] bg-white/[0.03] transition hover:border-lagoon/25 hover:bg-lagoon/[0.04]"
            >
              {/* Thumbnail */}
              <div className="relative h-[100px] w-full overflow-hidden bg-black/30">
                {product.values.image_url ? (
                  <img
                    src={product.values.image_url}
                    alt={product.values.product_name}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-600">
                    <IconImagePlaceholder className="h-8 w-8" />
                  </div>
                )}
                <span className="absolute right-1.5 top-1.5">
                  <ScoreBadge score={product.score} />
                </span>
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-1 px-2.5 py-2">
                <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-white">
                  {product.values.product_name.trim() || product.values.title}
                </p>
                <div className="mt-auto flex items-center gap-1.5 pt-1">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-lagoon/20 text-lagoon">
                    <IconShoppingBag className="h-2.5 w-2.5" />
                  </span>
                  <span className="truncate text-[10px] text-slate-500">
                    id {product.id}
                  </span>
                </div>
              </div>

              {/* Banner footer */}
              {topBanner && (
                <div className="flex items-center gap-1.5 border-t border-white/[0.05] px-2.5 py-1.5">
                  {topBanner.values.logo_url && (
                    <img
                      src={topBanner.values.logo_url}
                      alt={topBanner.values.name}
                      className="h-3.5 w-3.5 shrink-0 rounded-sm object-contain"
                    />
                  )}
                  <span className="truncate text-[10px] text-slate-500">
                    {topBanner.values.name}
                  </span>
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
