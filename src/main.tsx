import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.scss";
import App from "./App.tsx";
import { createStore } from "./store.ts";
import { WorkerBridge } from "./lib/index.ts";
// import type { RootState } from "./store.ts";

type SWEvents = {
  "observable:clients": { clients: string[] };
};

// Expose globally so it can be called from the browser console at any time:
// clearWorkers()
// (window as unknown as Record<string, unknown>).clearWorkers = clearWorkers;

async function bootstrap() {
  // let preloadedState: Record<string, unknown> | undefined;

  if ("serviceWorker" in navigator && navigator.serviceWorker) {
    const bridge = WorkerBridge.create<SWEvents>(navigator.serviceWorker);

    await import("virtual:pwa-register").then(({ registerSW }) => {
      registerSW({ immediate: true });
    });

    window.addEventListener("pagehide", () => {
      bridge.post("CLIENT_DISCONNECT", {
        url: location.href,
        timestamp: Date.now(),
      });
    });

    // Register SW event listeners BEFORE connecting so early broadcasts aren't missed.
    bridge.on("observable:clients", (payload) => {
      console.log("Connected clients:", payload);
    });

    if (navigator.serviceWorker.controller) {
      // preloadedState = await bridge
      //   .send<RootState>("CLIENT_CONNECT", {
      //     url: location.href,
      //     timestamp: Date.now(),
      //   })
      //   .then((s) => s ?? undefined)
      //   .catch(() => undefined);
    } else {
      bridge.on("controllerchange").then(() => {
        return bridge.send("CLIENT_CONNECT", {
          url: location.href,
          timestamp: Date.now(),
        });
      });
    }
  }

  const store = createStore({
    // preloadedState,
    middleware: [
      () => (next) => (action) => {
        console.log({ action });

        return next(action);
      },
    ],
  });

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>,
  );
}

bootstrap();
