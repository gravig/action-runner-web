import { PUBLIC_BASE } from "./api";

export type ProductResult = {
  type: "product";
  id: number;
  score: number;
  values: {
    url: string;
    title: string;
    product_name: string;
    image_url: string;
  };
};

export type CategoryResult = {
  type: "category";
  id: number;
  score: number;
  values: {
    name: string;
  };
};

export type BannerResult = {
  type: "banner";
  id: number;
  score: number;
  values: {
    name: string;
    logo_url: string;
  };
};

export type SearchResult = ProductResult | CategoryResult | BannerResult;
export type SearchResponse = SearchResult[];

export type SearchParams = {
  q: string;
  limit?: number;
  tables?: string;
};

export async function search(params: SearchParams): Promise<SearchResponse> {
  const { q, limit = 100, tables = "products,categories,banners" } = params;
  const qs = new URLSearchParams({ q, limit: String(limit), tables });
  const res = await fetch(`${PUBLIC_BASE}/search?${qs}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<SearchResponse>;
}
