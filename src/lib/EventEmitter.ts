import { Observable, type Subscription } from "./Observable";

type AnyEvents = Record<string, unknown>;

/**
 * Typed event bus that manages one {@link Observable} channel per event name.
 *
 * ### Basic usage
 * ```ts
 * const emitter = new EventEmitter<{ valueChanged: number; reset: void }>();
 *
 * emitter.on("valueChanged", (n) => console.log("new value", n));
 * emitter.emit("valueChanged", 42);  // → logs "new value 42"
 * ```
 *
 * ### React integration
 * Use {@link observable} to get the underlying channel and pass it to
 * `useObservable` / `useSubscriberCount` from `hooks/useObservable`.
 */
export class EventEmitter<Events extends AnyEvents> {
  private readonly _channels = new Map<keyof Events, Observable<unknown>>();
  private readonly _anyListeners = new Set<
    (event: string, payload: unknown) => void
  >();
  private readonly _subscriptionListeners = new Set<
    (event: string, count: number) => void
  >();

  private channel<K extends keyof Events>(
    event: K,
  ): Observable<Events[K] | undefined> {
    if (!this._channels.has(event)) {
      const obs = new Observable<Events[K] | undefined>(undefined);
      this._channels.set(event, obs as any);
      // Hook up subscription change tracking for this new channel.
      obs.onSubscriptionChanged(() => {
        this._subscriptionListeners.forEach((fn) =>
          fn(event as string, obs.subscriberCount),
        );
      });
    }
    return this._channels.get(event)! as Observable<Events[K] | undefined>;
  }

  /** Subscribe to an event. */
  public on<K extends keyof Events>(
    event: K,
    subscription: Subscription<Events[K] | undefined>,
  ): void {
    this.channel(event).subscribe(subscription);
  }

  /** Unsubscribe from an event. */
  public off<K extends keyof Events>(
    event: K,
    subscription: Subscription<Events[K] | undefined>,
  ): void {
    this.channel(event).unsubscribe(subscription);
  }

  /** Emit an event with a payload. Notifies all `onAny` listeners too. */
  public emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.channel(event).set(payload);
    this._anyListeners.forEach((fn) => fn(event as string, payload));
  }

  /**
   * Emit an event **without** notifying `onAny` listeners.
   * Used by the cross-window bridge to replay incoming messages without
   * re-broadcasting them back, preventing echo loops.
   */
  public emitBridged<K extends keyof Events>(
    event: K | string,
    payload: Events[K] | unknown,
  ): void {
    this.channel(event as K).set(payload as Events[K]);
  }

  /**
   * Register a listener that fires whenever any event's subscriber count
   * changes. Fires immediately for all currently-known channels so the
   * caller has the initial state.
   *
   * Returns a cleanup function.
   */
  public onAnySubscriptionChanged(
    listener: (event: string, count: number) => void,
  ): () => void {
    this._subscriptionListeners.add(listener);
    // Fire immediately for all existing channels.
    this._channels.forEach((obs, event) =>
      listener(event as string, obs.subscriberCount),
    );
    return () => this._subscriptionListeners.delete(listener);
  }

  /**
   * Subscribe to **all** events emitted on this emitter.
   * Fires for every `emit()` call but NOT for `emitBridged()`.
   * Returns a cleanup function.
   */
  public onAny(
    listener: (event: string, payload: unknown) => void,
  ): () => void {
    this._anyListeners.add(listener);
    return () => this._anyListeners.delete(listener);
  }

  /**
   * Returns the underlying {@link Observable} for a given event.
   * Use this with `useObservable` / `useSubscriberCount` inside React components.
   */
  public observable<K extends keyof Events>(
    event: K,
  ): Observable<Events[K] | undefined> {
    return this.channel(event);
  }

  /** Current number of active subscriptions for an event. */
  public subscriberCount<K extends keyof Events>(event: K): number {
    return this.channel(event).subscriberCount;
  }

  /**
   * Calls `listener` once for every event channel that has been accessed,
   * passing the event name and its current subscriber count.
   * Useful for broadcasting a snapshot of current counts to a newly connected
   * peer without registering a persistent listener.
   */
  public eachSubscriberCount(
    listener: (event: string, count: number) => void,
  ): void {
    this._channels.forEach((obs, event) =>
      listener(event as string, obs.subscriberCount),
    );
  }
}
