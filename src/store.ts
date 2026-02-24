import { configureStore } from "@reduxjs/toolkit";
import { productsApi } from "./services/productsApi";
import { logsApi } from "./services/logsApi";
import { searchApi } from "./services/searchApi";
import { actionsApi } from "./services/actionsApi";
import { datasetsApi } from "./services/datasetsApi";

export const store = configureStore({
  reducer: {
    [productsApi.reducerPath]: productsApi.reducer,
    [logsApi.reducerPath]: logsApi.reducer,
    [searchApi.reducerPath]: searchApi.reducer,
    [actionsApi.reducerPath]: actionsApi.reducer,
    [datasetsApi.reducerPath]: datasetsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      productsApi.middleware,
      logsApi.middleware,
      searchApi.middleware,
      actionsApi.middleware,
      datasetsApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
