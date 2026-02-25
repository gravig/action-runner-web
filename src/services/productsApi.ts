import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ProductPayload } from "../types/products";
import { WORKER_BASE } from "./api";

type ProductsResponse = {
  count: number;
  products: ProductPayload[];
};

export const productsApi = createApi({
  reducerPath: "productsApi",
  baseQuery: fetchBaseQuery({ baseUrl: WORKER_BASE }),
  tagTypes: ["Products"],
  endpoints: (builder) => ({
    getProducts: builder.query<ProductPayload[], void>({
      query: () => "/products",
      transformResponse: (response: ProductsResponse) => response.products,
      providesTags: (result) => {
        if (!result) return [{ type: "Products", id: "LIST" }];
        return [
          ...result.map((product) => ({
            type: "Products" as const,
            id: product.url || product.title,
          })),
          { type: "Products", id: "LIST" },
        ];
      },
    }),
  }),
});

export const { useGetProductsQuery } = productsApi;
