import { useMemo } from "react";
import { useSocket } from "../hooks/useSocket";
import type { ProductEvent } from "../types/products";

const badgeByStatus: Record<string, string> = {
  idle: "border-white/20 text-white/80",
  connecting: "border-lagoon/60 text-lagoon",
  open: "border-lime/70 text-lime",
  closed: "border-white/20 text-white/60",
  error: "border-red-400 text-red-300",
};

function parseProduct(lastMessage: string | null): {
  event: ProductEvent | null;
  parseError?: string;
} {
  if (!lastMessage) return { event: null };
  try {
    const parsed = JSON.parse(lastMessage) as ProductEvent;
    return { event: parsed };
  } catch (err) {
    return {
      event: null,
      parseError: `Invalid product payload: ${(err as Error).message}`,
    };
  }
}

type Props = {
  className?: string;
};

function ProductPreview({ className }: Props) {
  const { status, lastMessage, error } = useSocket("products");

  const { event, parseError } = useMemo(
    () => parseProduct(lastMessage),
    [lastMessage],
  );
  const product = event?.product;

  return (
    <div
      className={`glass-panel flex h-full min-h-0 flex-1 flex-col p-0 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">
            Latest product
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
              badgeByStatus[status] ?? badgeByStatus.idle
            }`}
          >
            {status}
          </span>
        </div>
        {error ? <span className="text-xs text-red-300">{error}</span> : null}
      </div>

      <div className="flex-1 space-y-3 overflow-auto px-4 py-3">
        {!lastMessage && (
          <p className="text-sm text-slate-300">
            Waiting for product messages...
          </p>
        )}
        {parseError && <p className="text-sm text-red-300">{parseError}</p>}
        {event && event.error && (
          <p className="text-sm text-red-300">Backend error: {event.error}</p>
        )}
        {event && !event.product && !event.error ? (
          <p className="text-sm text-slate-300">
            No product found in message for {event.path}
          </p>
        ) : null}

        {product ? (
          <div className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-[260px,1fr]">
              <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full min-h-[180px] items-center justify-center text-sm text-slate-400">
                    No image
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {event?.path}
                  </p>
                  <h3 className="text-lg font-semibold text-white">
                    {product.title || product.productName}
                  </h3>
                  <p className="text-xs text-slate-300">{product.url}</p>
                  {product.assetPath ? (
                    <p className="text-xs text-slate-400">
                      Asset: {product.assetPath}
                    </p>
                  ) : null}
                </div>

                {product.categories?.length ? (
                  <div className="flex flex-wrap gap-2 text-[11px] text-lime">
                    {product.categories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full bg-lime/10 px-3 py-1"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {product.productInfo?.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {product.productInfo.map((info) => (
                  <div
                    key={info.label}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <p className="text-xs text-slate-400">{info.label}</p>
                    <p className="text-sm font-medium text-white">
                      {info.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ProductPreview;
