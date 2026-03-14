import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API, TOKEN_KEY } from "./api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthState {
  token: string | null;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
}

interface LoginPayload {
  username: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

// ─── Thunk ───────────────────────────────────────────────────────────────────

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ username, password }: LoginPayload, { rejectWithValue }) => {
    const res = await fetch(API.authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return rejectWithValue(text || "Invalid credentials");
    }

    const data: TokenResponse = await res.json();
    localStorage.setItem(TOKEN_KEY, data.access_token);
    return data.access_token;
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: localStorage.getItem(TOKEN_KEY),
    status: "idle",
    error: null,
  } as AuthState,
  reducers: {
    logout(state) {
      state.token = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem(TOKEN_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, { payload }) => {
        state.token = payload;
        state.status = "success";
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, { payload }) => {
        state.status = "error";
        state.error = (payload as string) ?? "Login failed";
      });
  },
});

export const { logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
