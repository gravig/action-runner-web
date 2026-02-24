import { useGetProductsQuery } from "../services/productsApi";

function Products() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetProductsQuery();

  return (
    <div className="grid-glow">
      <div className="mx-auto max-w-5xl px-6 py-12 md:px-10">
        <div className="glass-panel mb-8 flex items-center justify-between px-6 py-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Products
            </p>
            <h1 className="text-3xl font-semibold text-white">Catalog feed</h1>
            <p className="text-sm text-slate-300">
              Fetched via RTK Query from http://localhost:8000/products
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-lagoon/60 hover:text-lagoon"
            disabled={isFetching}
          >
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="glass-panel p-0">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-lg font-semibold text-white">
              Latest products
            </h2>
            {isLoading ? (
              <span className="text-xs text-slate-300">Loading...</span>
            ) : null}
            {isError ? (
              <span className="text-xs text-red-300">
                {(error as { status?: string; data?: unknown })?.status ||
                  "Error"}
              </span>
            ) : null}
          </div>

          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                Loading products...
              </div>
            ) : null}

            {!isLoading && isError ? (
              <div className="px-4 py-6 text-sm text-red-300">
                Unable to load products. Please verify the backend at 8000 is
                running.
              </div>
            ) : null}

            {!isLoading && !isError && (!data || data.length === 0) ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                No products returned yet.
              </div>
            ) : null}

            {!isLoading &&
              !isError &&
              data?.map((product) => (
                <div
                  key={product.url || product.title}
                  className="flex items-center gap-4 px-4 py-4 md:gap-6"
                >
                  <div className="h-20 w-20 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {product.title || product.productName}
                      </span>
                      {product.url ? (
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-lagoon hover:text-lime"
                        >
                          {product.url}
                        </a>
                      ) : null}
                    </div>

                    {product.categories?.length ? (
                      <div className="flex flex-wrap gap-2 text-[11px] text-lime">
                        {product.categories.map((cat) => (
                          <span
                            key={`${product.url || product.title}-${cat}`}
                            className="rounded-full bg-lime/10 px-3 py-1"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        No categories
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Products;
