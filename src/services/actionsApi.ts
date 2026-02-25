import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ActionShape } from "../types/actions";
import { ADMIN_BASE } from "./api";

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
  baseQuery: fetchBaseQuery({ baseUrl: ADMIN_BASE }),
  tagTypes: ["ActionShapes"],
  endpoints: (builder) => ({
    getActionShapes: builder.query<ActionShape[], void>({
      query: () => "/actions/shapes",
      providesTags: ["ActionShapes"],
    }),
    runAction: builder.mutation<unknown, unknown>({
      query: (payload) => ({
        url: "/run",
        method: "POST",
        body: payload,
      }),
    }),
    createCustomAction: builder.mutation<
      ActionShape,
      CreateCustomActionPayload
    >({
      query: (payload) => ({
        url: "/actions/custom",
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
        url: `/actions/custom/${encodeURIComponent(actionName)}`,
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
