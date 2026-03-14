import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { Dataset } from "../types/datasets";
import { ADMIN_BASE, apiFetch } from "./api";

export function fetchDatasetsFn(): Promise<Dataset[]> {
  return apiFetch(`${ADMIN_BASE}/datasets`);
}

export function fetchDatasetFn(name: string): Promise<unknown> {
  return apiFetch(`${ADMIN_BASE}/datasets/${encodeURIComponent(name)}`);
}

export const fetchDatasets = createAsyncThunk(
  "datasets/fetchAll",
  fetchDatasetsFn,
);

interface DatasetsState {
  list: Dataset[] | null;
  isLoading: boolean;
  error: string | null;
}

const datasetsSlice = createSlice({
  name: "datasets",
  initialState: { list: null, isLoading: false, error: null } as DatasetsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDatasets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDatasets.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.list = payload;
      })
      .addCase(fetchDatasets.rejected, (state, { error }) => {
        state.isLoading = false;
        state.error = error.message ?? "Failed to load datasets";
      });
  },
});

export const datasetsReducer = datasetsSlice.reducer;

type ThunkAppDispatch = ThunkDispatch<unknown, undefined, UnknownAction>;

export function useDatasets() {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { list, isLoading, error } = useSelector(
    (s: { datasets: DatasetsState }) => s.datasets,
  );
  useEffect(() => {
    dispatch(fetchDatasets());
  }, [dispatch]);
  return { data: list ?? undefined, isLoading, error };
}

export function useDataset(name: string) {
  const [data, setData] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchDatasetFn(name)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setIsLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [name]);
  return { data, isLoading, isError: !!error, error };
}
