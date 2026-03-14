import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { Projection, ProjectionListResponse } from "../types/projections";
import { ADMIN_BASE } from "./api";

export type UpsertProjectionPayload = {
  id?: string;
  title: string;
  web_components: Projection["web_components"];
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

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

export const fetchProjectionsFn = (): Promise<ProjectionListResponse> =>
  apiFetch(`${ADMIN_BASE}/projections`);

export const fetchProjectionFn = (id: string): Promise<Projection> =>
  apiFetch(`${ADMIN_BASE}/projections/${encodeURIComponent(id)}`);

export const fetchProjectionDefinitionFn = (id: string): Promise<Projection> =>
  apiFetch(`${ADMIN_BASE}/projections/${encodeURIComponent(id)}/definition`);

export function createProjectionFn(
  payload: Omit<UpsertProjectionPayload, "id">,
): Promise<Projection> {
  return apiFetch(`${ADMIN_BASE}/projections`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export function updateProjectionFn({
  id,
  ...body
}: UpsertProjectionPayload & { id: string }): Promise<Projection> {
  return apiFetch(`${ADMIN_BASE}/projections/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
}

// ─── Async thunk ──────────────────────────────────────────────────────────────

export const fetchProjections = createAsyncThunk(
  "projections/fetchAll",
  fetchProjectionsFn,
);

// ─── Slice ────────────────────────────────────────────────────────────────────

interface ProjectionsState {
  list: ProjectionListResponse | null;
  isLoading: boolean;
  error: string | null;
}

const projectionsSlice = createSlice({
  name: "projections",
  initialState: {
    list: null,
    isLoading: false,
    error: null,
  } as ProjectionsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjections.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.list = payload;
      })
      .addCase(fetchProjections.rejected, (state, { error }) => {
        state.isLoading = false;
        state.error = error.message ?? "Failed to load projections";
      });
  },
});

export const projectionsReducer = projectionsSlice.reducer;

type ThunkAppDispatch = ThunkDispatch<unknown, undefined, UnknownAction>;

// ─── Query hooks ──────────────────────────────────────────────────────────────

export function useProjections() {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { list, isLoading, error } = useSelector(
    (s: { projections: ProjectionsState }) => s.projections,
  );
  useEffect(() => {
    dispatch(fetchProjections());
  }, [dispatch]);
  return { data: list ?? undefined, isLoading, error };
}

export function useProjection(id: string, options?: { skip?: boolean }) {
  const skip = options?.skip ?? false;
  const [data, setData] = useState<Projection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (skip || !id) {
      setData(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchProjectionFn(id)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(String(e));
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, skip]);
  return { data, isLoading, error };
}

export function useProjectionDefinition(
  id: string,
  options?: { skip?: boolean },
) {
  const skip = options?.skip ?? false;
  const [data, setData] = useState<Projection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (skip || !id) {
      setData(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchProjectionDefinitionFn(id)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(String(e));
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, skip]);
  return { data, isLoading, error };
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useCreateProjection() {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function create(
    payload: Omit<UpsertProjectionPayload, "id">,
  ): Promise<Projection> {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createProjectionFn(payload);
      dispatch(fetchProjections());
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

export function useUpdateProjection() {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function update(
    payload: UpsertProjectionPayload & { id: string },
  ): Promise<Projection> {
    setIsLoading(true);
    setError(null);
    try {
      const result = await updateProjectionFn(payload);
      dispatch(fetchProjections());
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
