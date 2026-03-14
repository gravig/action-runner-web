export type Updater<T> = (prev: T) => T;
export type Subscription<T> = (next: T) => void;

export class Observable<T> {
  private value: T;
  private subscriptions: Subscription<T>[] = [];

  /**
   * Internal listeners notified whenever the subscription list grows or shrinks.
   * Used by {@link onSubscriptionChanged} to enable React integration via
   * `useSyncExternalStore` without making Observable itself React-aware.
   */
  private readonly _subscriptionListeners = new Set<() => void>();

  public constructor(value: T) {
    this.value = value;
  }

  public subscribe(subscription: Subscription<T>): void {
    this.subscriptions.push(subscription);
    this._subscriptionListeners.forEach((fn) => fn());
  }

  public unsubscribe(subscription: Subscription<T>): void {
    this.subscriptions = this.subscriptions.filter(
      (item) => item !== subscription,
    );
    this._subscriptionListeners.forEach((fn) => fn());
  }

  public set(next: T): void {
    this.value = next;
    this.notify(next);
  }

  public get(): T {
    return this.value;
  }

  public update(updater: Updater<T>): void {
    this.set(updater(this.value));
  }

  /** Number of active subscriptions. */
  public get subscriberCount(): number {
    return this.subscriptions.length;
  }

  /**
   * Register a zero-argument listener that fires whenever the subscription list
   * changes (i.e. after every `subscribe` / `unsubscribe` call).
   *
   * Returns a cleanup function that removes the listener.
   *
   * @example
   * ```ts
   * const cleanup = obs.onSubscriptionChanged(() => {
   *   console.log("subscriber count:", obs.subscriberCount);
   * });
   * // later…
   * cleanup();
   * ```
   */
  public onSubscriptionChanged(listener: () => void): () => void {
    this._subscriptionListeners.add(listener);
    return () => this._subscriptionListeners.delete(listener);
  }

  private notify(next: T): void {
    this.subscriptions.forEach((subscription) => {
      subscription(next);
    });
  }
}
