import { configureStore, type Middleware } from "@reduxjs/toolkit";
import { actionsReducer } from "./services/actionsApi";
import { productsReducer } from "./services/productsApi";
import { logsReducer } from "./services/logsApi";
import { datasetsReducer } from "./services/datasetsApi";
import { projectionsReducer } from "./services/projectionsApi";
import { assetsReducer } from "./services/assetsApi";

type CreateStoreOptions = {
  middleware?: Middleware[];
  preloadedState?: Record<string, unknown>;
};

export const createStore = ({
  middleware,
  preloadedState,
}: CreateStoreOptions = {}) => {
  const store = configureStore({
    reducer: {
      actions: actionsReducer,
      products: productsReducer,
      logs: logsReducer,
      datasets: datasetsReducer,
      projections: projectionsReducer,
      assets: assetsReducer,
    },
    ...(preloadedState !== undefined && {
      preloadedState: preloadedState as never,
    }),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(...(middleware ?? [])),
  });

  return store;
};

export type RootState = ReturnType<ReturnType<typeof createStore>["getState"]>;
export type AppDispatch = ReturnType<
  ReturnType<typeof createStore>["dispatch"]
>;
