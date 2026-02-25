import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
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

export const searchApi = createApi({
  reducerPath: "searchApi",
  baseQuery: fetchBaseQuery({ baseUrl: PUBLIC_BASE }),
  endpoints: (builder) => ({
    search: builder.query<SearchResponse, SearchParams>({
      query: ({ q, limit = 100, tables = "products,categories,banners" }) => ({
        url: "/search",
        params: { q, limit, tables },
      }),
    }),
  }),
});

export const { useLazySearchQuery } = searchApi;
