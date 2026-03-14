import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { ProductPayload } from "../types/products";
import { WORKER_BASE } from "./api";

type ProductsResponse = {
  count: number;
  products: ProductPayload[];
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchProductsFn(): Promise<ProductPayload[]> {
  const res = await fetch(`${WORKER_BASE}/products`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data: ProductsResponse = await res.json();
  return data.products;
}

// ─── Async thunk ──────────────────────────────────────────────────────────────

export const fetchProducts = createAsyncThunk(
  "products/fetch",
  fetchProductsFn,
);

// ─── Slice ────────────────────────────────────────────────────────────────────

interface ProductsState {
  items: ProductPayload[] | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
}

const productsSlice = createSlice({
  name: "products",
  initialState: {
    items: null,
    isLoading: false,
    isFetching: false,
    error: null,
  } as ProductsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = state.items === null;
        state.isFetching = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.isFetching = false;
        state.items = payload;
      })
      .addCase(fetchProducts.rejected, (state, { error }) => {
        state.isLoading = false;
        state.isFetching = false;
        state.error = error.message ?? "Failed to load products";
      });
  },
});

export const productsReducer = productsSlice.reducer;

type ThunkAppDispatch = ThunkDispatch<unknown, undefined, UnknownAction>;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProducts() {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { items, isLoading, isFetching, error } = useSelector(
    (s: { products: ProductsState }) => s.products,
  );
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);
  return {
    data: items ?? undefined,
    isLoading,
    isFetching,
    isError: !!error,
    error,
    refetch: () => dispatch(fetchProducts()),
  };
}
