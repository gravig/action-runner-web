import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Dataset } from "../types/datasets";

export const datasetsApi = createApi({
  reducerPath: "datasetsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:8000" }),
  endpoints: (builder) => ({
    getDatasets: builder.query<Dataset[], void>({
      query: () => "/admin/datasets",
    }),
    getDataset: builder.query<unknown, string>({
      query: (name) => `/admin/datasets/${encodeURIComponent(name)}`,
    }),
  }),
});

export const { useGetDatasetsQuery, useGetDatasetQuery } = datasetsApi;
