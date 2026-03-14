import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { ActionShape } from "../types/actions";
import { ADMIN_BASE } from "./api";

export type CreateCustomActionPayload = {
  actionName: string;
  payload: unknown;
  summary?: string;
  tags?: string[];
};

export type UpdateCustomActionPayload = {
  actionName: string;
  payload: unknown;
  summary?: string;
  tags?: string[];
};

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const jsonHeaders = { "Content-Type": "application/json" };

export function fetchActionShapesFn(): Promise<ActionShape[]> {
  return apiFetch(`${ADMIN_BASE}/actions/shapes`);
}

export function runActionFn(payload: unknown): Promise<unknown> {
  return apiFetch(`${ADMIN_BASE}/run`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export function createCustomActionFn(
  payload: CreateCustomActionPayload,
): Promise<ActionShape> {
  return apiFetch(`${ADMIN_BASE}/actions/custom`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export function updateCustomActionFn({
  actionName,
  ...body
}: UpdateCustomActionPayload): Promise<ActionShape> {
  return apiFetch(
    `${ADMIN_BASE}/actions/custom/${encodeURIComponent(actionName)}`,
    { method: "PUT", headers: jsonHeaders, body: JSON.stringify(body) },
  );
}

export function deleteCustomActionFn(actionName: string): Promise<void> {
  return apiFetch(
    `${ADMIN_BASE}/actions/custom/${encodeURIComponent(actionName)}`,
    { method: "DELETE" },
  );
}

export const fetchActionShapes = createAsyncThunk(
  "actions/fetchShapes",
  fetchActionShapesFn,
);

interface ActionsState {
  shapes: ActionShape[] | null;
  isLoading: boolean;
  error: string | null;
}

const actionsSlice = createSlice({
  name: "actions",
  initialState: { shapes: null, isLoading: false, error: null } as ActionsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActionShapes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActionShapes.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.shapes = payload;
      })
      .addCase(fetchActionShapes.rejected, (state, { error }) => {
        state.isLoading = false;
        state.error = error.message ?? "Failed to load shapes";
      });
  },
});

export const actionsReducer = actionsSlice.reducer;

type ThunkAppDispatch = ThunkDispatch<unknown, undefined, UnknownAction>;

// ─── Query hook ───────────────────────────────────────────────────────────────

export function useActionShapes() {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { shapes, isLoading, error } = useSelector(
    (s: { actions: ActionsState }) => s.actions,
  );
  useEffect(() => {
    dispatch(fetchActionShapes());
  }, [dispatch]);
  return {
    data: shapes ?? undefined,
    isLoading,
    error,
    refetch: () => dispatch(fetchActionShapes()),
  };
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useRunAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function runAction(payload: unknown): Promise<unknown> {
    setIsLoading(true);
    setError(null);
    try {
      return await runActionFn(payload);
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }
  return [runAction, { isLoading, error }] as const;
}

export function useCreateCustomAction() {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function create(
    payload: CreateCustomActionPayload,
  ): Promise<ActionShape> {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createCustomActionFn(payload);
      dispatch(fetchActionShapes());
      return result;
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }
  return [create, { isLoading, error }] as const;
}

export function useUpdateCustomAction() {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function update(
    payload: UpdateCustomActionPayload,
  ): Promise<ActionShape> {
    setIsLoading(true);
    setError(null);
    try {
      const result = await updateCustomActionFn(payload);
      dispatch(fetchActionShapes());
      return result;
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }
  return [update, { isLoading, error }] as const;
}

export function useDeleteCustomAction() {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function del(actionName: string): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      await deleteCustomActionFn(actionName);
      dispatch(fetchActionShapes());
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }
  return [del, { isLoading, error }] as const;
}
