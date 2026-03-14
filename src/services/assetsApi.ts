import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type {
  AssetMetadata,
  CreateAssetPayload,
  UpdateAssetPayload,
} from "../types/assets";
import { ADMIN_BASE } from "./api";

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

export const fetchAssetsFn = (): Promise<AssetMetadata[]> =>
  apiFetch<{ count: number; assets: AssetMetadata[] }>(
    `${ADMIN_BASE}/assets`,
  ).then((r) => r.assets);

export const fetchAssetContentFn = (id: string): Promise<unknown> =>
  apiFetch(`${ADMIN_BASE}/assets/${encodeURIComponent(id)}`);

export function createAssetFn(
  payload: CreateAssetPayload,
): Promise<AssetMetadata> {
  return apiFetch(`${ADMIN_BASE}/assets`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export function updateAssetFn({
  id,
  ...body
}: { id: string } & UpdateAssetPayload): Promise<AssetMetadata> {
  return apiFetch(`${ADMIN_BASE}/assets/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
}

export function deleteAssetFn(id: string): Promise<void> {
  return apiFetch(`${ADMIN_BASE}/assets/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ─── Async thunk + slice (list only) ────────────────────────────────────────────

export const fetchAssets = createAsyncThunk("assets/fetchAll", fetchAssetsFn);

interface AssetsState {
  list: AssetMetadata[] | null;
  isLoading: boolean;
  error: string | null;
}

const assetsSlice = createSlice({
  name: "assets",
  initialState: { list: null, isLoading: false, error: null } as AssetsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.list = payload;
      })
      .addCase(fetchAssets.rejected, (state, { error }) => {
        state.isLoading = false;
        state.error = error.message ?? "Failed to load assets";
      });
  },
});

export const assetsReducer = assetsSlice.reducer;

type ThunkAppDispatch = ThunkDispatch<unknown, undefined, UnknownAction>;

// ─── Query hooks ──────────────────────────────────────────────────────────────────

export function useAssets() {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { list, isLoading, error } = useSelector(
    (s: { assets: AssetsState }) => s.assets,
  );
  useEffect(() => {
    dispatch(fetchAssets());
  }, [dispatch]);
  return { data: list ?? [], isLoading, isError: !!error };
}

export function useAssetContent(id: string, options?: { skip?: boolean }) {
  const skip = options?.skip ?? false;
  const [data, setData] = useState<unknown>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  useEffect(() => {
    if (skip || !id) {
      setData(undefined);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setIsError(false);
    fetchAssetContentFn(id)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsError(true);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, skip]);
  return { data, isLoading, isError };
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useCreateAsset() {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function create(payload: CreateAssetPayload): Promise<AssetMetadata> {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createAssetFn(payload);
      dispatch(fetchAssets());
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

export function useUpdateAsset() {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function update(
    payload: { id: string } & UpdateAssetPayload,
  ): Promise<AssetMetadata> {
    setIsLoading(true);
    setError(null);
    try {
      const result = await updateAssetFn(payload);
      dispatch(fetchAssets());
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

export function useDeleteAsset() {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function del(id: string): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      await deleteAssetFn(id);
      dispatch(fetchAssets());
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }
  return [del, { isLoading, error }] as const;
}
