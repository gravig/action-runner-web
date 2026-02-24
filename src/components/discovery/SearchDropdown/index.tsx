import type {
  ProductResult,
  CategoryResult,
  BannerResult,
} from "../../../services/searchApi";
import type { SectionKey } from "../../../hooks/useDiscoverySearch";
import { CategorySection } from "../CategorySection";
import { ProductSection } from "../ProductSection";
import { BannerSection } from "../BannerSection";

type Props = {
  show: boolean;
  isFetching: boolean;
  isError: boolean;
  isUninitialized: boolean;
  query: string;
  hasResults: boolean;
  sectionOrder: SectionKey[];
  products: ProductResult[];
  categories: CategoryResult[];
  banners: BannerResult[];
};

export function SearchDropdown({
  show,
  isFetching,
  isError,
  isUninitialized,
  query,
  hasResults,
  sectionOrder,
  products,
  categories,
  banners,
}: Props) {
  if (!show) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/[0.07] bg-[#080e1c]/97 shadow-panel backdrop-blur">
      {/* Loading */}
      {isFetching && (
        <div className="flex items-center justify-center py-10">
          <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-white/10 border-t-lagoon" />
        </div>
      )}

      {/* Error */}
      {!isFetching && isError && (
        <div className="px-5 py-6 text-center text-sm text-red-400">
          Search failed — is the backend running at{" "}
          <span className="font-mono text-red-300">localhost:8000</span>?
        </div>
      )}

      {/* No results */}
      {!isFetching && !isError && !isUninitialized && !hasResults && (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          No results for{" "}
          <span className="font-semibold text-white">"{query}"</span>
        </div>
      )}

      {/* Results — sections sorted by best score */}
      {!isFetching && !isError && hasResults && (
        <div>
          {sectionOrder.map((section, idx) => {
            const divider = idx > 0 && (
              <div className="border-t border-white/[0.05]" />
            );

            if (section === "categories" && categories.length > 0)
              return (
                <div key="categories">
                  {divider}
                  <CategorySection categories={categories} />
                </div>
              );

            if (section === "products" && products.length > 0)
              return (
                <div key="products">
                  {divider}
                  <ProductSection products={products} banners={banners} />
                </div>
              );

            if (section === "banners" && banners.length > 0)
              return (
                <div key="banners">
                  {divider}
                  <BannerSection banners={banners} />
                </div>
              );

            return null;
          })}
        </div>
      )}
    </div>
  );
}
