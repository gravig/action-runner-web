import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Dataset } from "../types/datasets";
import { ADMIN_BASE } from "./api";

export const datasetsApi = createApi({
  reducerPath: "datasetsApi",
  baseQuery: fetchBaseQuery({ baseUrl: ADMIN_BASE }),
  endpoints: (builder) => ({
    getDatasets: builder.query<Dataset[], void>({
      query: () => "/datasets",
    }),
    getDataset: builder.query<unknown, string>({
      query: (name) => `/datasets/${encodeURIComponent(name)}`,
    }),
  }),
});

export const { useGetDatasetsQuery, useGetDatasetQuery } = datasetsApi;
