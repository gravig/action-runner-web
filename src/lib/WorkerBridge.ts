import { EventEmitter } from "./EventEmitter";
import type { Subscription } from "./Observable";

const RESPONSE_TYPE = "SW_RESPONSE";

// ---------------------------------------------------------------------------
// Shared: PromiseEmitter
// Extends EventEmitter with a Promise-form on() overload.
// ---------------------------------------------------------------------------

class PromiseEmitter<
  Events extends Record<string, unknown>,
> extends EventEmitter<Events> {
  /** Persistent subscription — stays active until off() is called. */
  on<K extends keyof Events>(event: K, callback: Subscription<Events[K]>): void;

  /** Await the next occurrence — auto-unsubscribes after first emission. */
  on<K extends keyof Events>(event: K): Promise<Events[K] | undefined>;

  on<K extends keyof Events>(
    event: K,
    callback?: Subscription<Events[K]>,
  ): void | Promise<Events[K] | undefined> {
    if (callback) {
      // EventEmitter channels carry `T | undefined` internally; cast is safe.
      super.on(event, callback as Subscription<Events[K] | undefined>);
      return;
    }
    return new Promise<Events[K] | undefined>((resolve) => {
      const handler: Subscription<Events[K] | undefined> = (payload) => {
        super.off(event, handler);
        resolve(payload);
      };
      super.on(event, handler);
    });
  }
}

// ---------------------------------------------------------------------------
// SW side: WorkerClient
// A per-connected-client handle emitted on "connect".
//
// Usage (socket.io style in sw.ts):
//   bridge.on("connect").then(client => {
//     client.reply(store.getState());           // resolve the client's send()
//     client.send("PUSH_EVENT", { data });      // fire-and-forget push
//     client.on("REDUX_ACTION", p => ...);      // listen to this client only
//     client.on("disconnect").then(() => ...);  // await disconnect
//   });
// ---------------------------------------------------------------------------

type WorkerClientBuiltins = {
  /** Emitted when the client sends CLIENT_DISCONNECT. */
  disconnect: undefined;
};

export class WorkerClient<
  Events extends Record<string, unknown> = Record<string, unknown>,
> extends PromiseEmitter<Events & WorkerClientBuiltins> {
  readonly clientId: string;
  private readonly _source: WindowClient;
  private _pendingRequestId: string | undefined;

  constructor(
    clientId: string,
    source: WindowClient,
    pendingRequestId: string | undefined,
  ) {
    super();
    this.clientId = clientId;
    this._source = source;
    this._pendingRequestId = pendingRequestId;
  }

  /** Send a fire-and-forget message to this specific connected client. */
  send(type: string, data: Record<string, unknown> = {}): void {
    console.log(`[WorkerClient] send "${type}" to clientId=${this.clientId}`);
    this._source.postMessage({ type, ...data });
  }

  /**
   * Resolve the client's pending `bridge.send()` Promise.
   * Only meaningful when the client used send() which attaches a requestId.
   */
  reply(result: unknown): void {
    if (this._pendingRequestId) {
      this._source.postMessage({
        type: RESPONSE_TYPE,
        requestId: this._pendingRequestId,
        result,
      });
      this._pendingRequestId = undefined;
    }
  }

  /** Called by SWBridge to deliver a routed message into this client's channels. */
  _dispatch(
    type: string,
    requestId: string | undefined,
    data: Record<string, unknown>,
  ): void {
    this._pendingRequestId = requestId;
    this.emit(
      type as keyof (Events & WorkerClientBuiltins),
      data as (Events & WorkerClientBuiltins)[keyof (Events &
        WorkerClientBuiltins)],
    );
  }
}

// ---------------------------------------------------------------------------
// SW side: SWBridge
// Returned by WorkerBridge.create(self) inside the service worker.
// ---------------------------------------------------------------------------

type SWBridgeEvents<ClientEvents extends Record<string, unknown>> = {
  /** Emitted whenever a new client sends CLIENT_CONNECT. */
  connect: WorkerClient<ClientEvents>;
} & ClientEvents;

class SWBridge<
  ClientEvents extends Record<string, unknown> = Record<string, unknown>,
> extends PromiseEmitter<SWBridgeEvents<ClientEvents>> {
  private readonly _clients = new Map<string, WorkerClient<ClientEvents>>();

  constructor(scope: ServiceWorkerGlobalScope) {
    super();

    scope.addEventListener("message", (event: ExtendableMessageEvent) => {
      if (typeof event.data !== "object" || event.data === null) return;

      const { type, requestId, ...rest } = event.data as Record<
        string,
        unknown
      >;
      if (typeof type !== "string") return;

      const source = event.source as unknown as WindowClient;
      const clientId = source?.id ?? "unknown";

      if (type === "CLIENT_CONNECT") {
        const client = new WorkerClient<ClientEvents>(
          clientId,
          source,
          requestId as string | undefined,
        );
        this._clients.set(clientId, client);
        this.emit("connect", client as any);
        return;
      }

      const client = this._clients.get(clientId);
      if (!client) return;

      if (type === "CLIENT_DISCONNECT") {
        this._clients.delete(clientId);
        client._dispatch("disconnect", undefined, {});
        return;
      }

      // Route to the per-client emitter and also emit globally on the bridge.
      client._dispatch(type, requestId as string | undefined, rest);
      this.emit(
        type as keyof SWBridgeEvents<ClientEvents>,
        rest as SWBridgeEvents<ClientEvents>[keyof SWBridgeEvents<ClientEvents>],
      );
    });
  }

  /** Send a message to every currently connected client. */
  broadcast(type: string, data: Record<string, unknown> = {}): void {
    const targets = [...this._clients.values()];
    console.log(
      `[SWBridge] broadcast "${type}" to ${targets.length} client(s)`,
    );
    for (const client of targets) {
      client.send(type, data);
    }
  }
}

// ---------------------------------------------------------------------------
// Client side: ClientBridge
// Returned by WorkerBridge.create(navigator.serviceWorker).
// ---------------------------------------------------------------------------

type ClientBridgeBuiltins = {
  /** Fires when the SW controller changes (new SW takes control). */
  controllerchange: ServiceWorker | null;
  /** Fires for every raw non-response message received from the SW. */
  message: MessageEvent;
};

class ClientBridge<
  SWEvents extends Record<string, unknown> = Record<string, never>,
> extends PromiseEmitter<ClientBridgeBuiltins & SWEvents> {
  constructor() {
    super();

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      this.emit("controllerchange", navigator.serviceWorker.controller as any);
    });

    navigator.serviceWorker.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === RESPONSE_TYPE) return;
      console.log("[ClientBridge] message received:", e.data);
      // Route to the raw "message" channel.
      this.emit("message", e as any);
      // Also route to a typed channel keyed by the message type string.
      if (typeof e.data?.type === "string") {
        const { type, ...rest } = e.data as Record<string, unknown>;
        this.emit(
          type as keyof (ClientBridgeBuiltins & SWEvents),
          rest as (ClientBridgeBuiltins &
            SWEvents)[keyof (ClientBridgeBuiltins & SWEvents)],
        );
      }
    });
  }

  /** Resolves with the active SW controller, waiting for one if not present. */
  async waitForController(): Promise<ServiceWorker> {
    if (navigator.serviceWorker.controller) {
      return navigator.serviceWorker.controller;
    }
    const sw = await this.on("controllerchange");
    if (sw) return sw;
    return this.waitForController();
  }

  /**
   * Send a message to the SW and await its `client.reply()`.
   * Waits for an active controller automatically.
   * Rejects if no response within `timeout` ms (default 5 s).
   */
  async send<T = unknown>(
    type: string,
    payload: Record<string, unknown> = {},
    timeout = 5000,
  ): Promise<T> {
    const controller = await this.waitForController();
    const requestId = crypto.randomUUID();

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        navigator.serviceWorker.removeEventListener("message", onMessage);
        reject(
          new Error(
            `[WorkerBridge] Timeout (${timeout}ms) waiting for "${type}"`,
          ),
        );
      }, timeout);

      const onMessage = (e: MessageEvent) => {
        if (e.data?.type === RESPONSE_TYPE && e.data?.requestId === requestId) {
          clearTimeout(timer);
          navigator.serviceWorker.removeEventListener("message", onMessage);
          resolve(e.data.result as T);
        }
      };

      // Register before posting to eliminate any race condition.
      navigator.serviceWorker.addEventListener("message", onMessage);
      controller.postMessage({ type, requestId, ...payload });
    });
  }

  /** Fire-and-forget — no response expected. */
  post(type: string, payload: Record<string, unknown> = {}): void {
    navigator.serviceWorker?.controller?.postMessage({ type, ...payload });
  }
}

// ---------------------------------------------------------------------------
// WorkerBridge — unified factory
// ---------------------------------------------------------------------------

/**
 * Factory that returns the correct bridge depending on the target context.
 *
 * **Client side** (`main.tsx`):
 * ```ts
 * const bridge = WorkerBridge.create(navigator.serviceWorker);
 * const state  = await bridge.send<RootState>("CLIENT_CONNECT", { url: location.href });
 * bridge.post("CLIENT_DISCONNECT", { url: location.href });
 * bridge.on("controllerchange").then(sw => console.log("new SW", sw));
 * ```
 *
 * **SW side** (`sw.ts`):
 * ```ts
 * type ClientEvents = { REDUX_ACTION: { action: unknown } };
 * const bridge = WorkerBridge.create<ClientEvents>(self);
 *
 * bridge.on("connect").then(client => {
 *   client.reply(store.getState());             // resolve client's send()
 *   client.on("REDUX_ACTION", p => store.dispatch(p?.action));
 *   client.on("disconnect").then(() => cleanup());
 * });
 * ```
 */
export class WorkerBridge {
  /** Create a ClientBridge attached to navigator.serviceWorker. */
  static create<
    SWEvents extends Record<string, unknown> = Record<string, never>,
  >(target: ServiceWorkerContainer | undefined | null): ClientBridge<SWEvents>;

  /** Create an SWBridge attached to the ServiceWorkerGlobalScope. */
  static create<
    ClientEvents extends Record<string, unknown> = Record<string, unknown>,
  >(target: ServiceWorkerGlobalScope): SWBridge<ClientEvents>;

  static create<
    Events extends Record<string, unknown> = Record<string, unknown>,
  >(
    target:
      | ServiceWorkerContainer
      | ServiceWorkerGlobalScope
      | undefined
      | null,
  ): ClientBridge<Events> | SWBridge<Events> {
    // ServiceWorkerGlobalScope exposes `clients`; ServiceWorkerContainer doesn't.
    // Guard against `target` being null/undefined (e.g. navigator.serviceWorker
    // is undefined in non-HTTPS / unsupported browser contexts).
    if (target != null && "clients" in target) {
      return new SWBridge<Events>(target as ServiceWorkerGlobalScope);
    }
    return new ClientBridge<Events>();
  }
}
