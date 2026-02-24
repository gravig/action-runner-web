import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ActionShape } from "../types/actions";

export type CreateCustomActionPayload = {
  actionName: string;
  payload: unknown;
  summary?: string;
  tags?: string[];
};

export type UpdateCustomActionPayload = {
  actionName: string; // used as the URL segment; cannot be changed
  payload: unknown;
  summary?: string;
  tags?: string[];
};

export const actionsApi = createApi({
  reducerPath: "actionsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:8000" }),
  tagTypes: ["ActionShapes"],
  endpoints: (builder) => ({
    getActionShapes: builder.query<ActionShape[], void>({
      query: () => "/admin/actions/shapes",
      providesTags: ["ActionShapes"],
    }),
    runAction: builder.mutation<unknown, unknown>({
      query: (payload) => ({
        url: "/admin/run",
        method: "POST",
        body: payload,
      }),
    }),
    createCustomAction: builder.mutation<
      ActionShape,
      CreateCustomActionPayload
    >({
      query: (payload) => ({
        url: "/admin/actions/custom",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["ActionShapes"],
    }),
    updateCustomAction: builder.mutation<
      ActionShape,
      UpdateCustomActionPayload
    >({
      query: ({ actionName, ...body }) => ({
        url: `/admin/actions/custom/${encodeURIComponent(actionName)}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ActionShapes"],
    }),
  }),
});

export const {
  useGetActionShapesQuery,
  useRunActionMutation,
  useCreateCustomActionMutation,
  useUpdateCustomActionMutation,
} = actionsApi;
