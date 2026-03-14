/// <reference lib="webworker" />

import { registerLifecycle, registerFetchHandler } from "./sw/index";
import { WorkerBridge, WorkerClient, Observable } from "./lib";

/** Messages the SW can receive from any connected client. */
type ClientEvents = {
  REDUX_ACTION: { action: { type: string; [key: string]: unknown } };
};

const _self = self as unknown as ServiceWorkerGlobalScope;

class ServiceWorker {
  static bridge = WorkerBridge.create<ClientEvents>(_self);
  static clients = new Observable<string[]>([]);

  static main() {
    const { bridge, clients } = ServiceWorker;
    // const store = createStore();

    registerLifecycle();
    registerFetchHandler();

    // Whenever the clients observable changes, broadcast the updated list.
    clients.subscribe((ids) => {
      bridge.broadcast("observable:clients", { clients: ids });
    });

    bridge.on("connect", ServiceWorker.onConnect);
    bridge.on("REDUX_ACTION", (payload) => {
      console.log({ payload });
      // store.dispatch(payload.action);
    });
  }

  static onConnect = (client: WorkerClient<ClientEvents>) => {
    const { clients } = ServiceWorker;

    clients.update((prev) => [...prev, client.clientId]);

    // Resolve the client's pending send("CLIENT_CONNECT") Promise.
    // Once a store lives in the SW, replace null with store.getState().
    client.reply(null);

    client.on("disconnect").then(() => {
      clients.update((prev) => prev.filter((id) => id !== client.clientId));
    });
  };
}

ServiceWorker.main();
