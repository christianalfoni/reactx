export const ENSURE_SYMBOL = Symbol('reactx.ensure');

/**
 * Type constraint for values that can be managed by ensure.
 * Requires a dispose method for cleanup.
 */
export interface Disposable {
  dispose(): void;
}

type MemoFactory<T extends (...params: any[]) => Disposable> = {
  (...params: Parameters<T>): ReturnType<T>;
  dispose: () => void;
  [ENSURE_SYMBOL]: true;
};

/**
 * Creates a memoized factory function that caches instances.
 *
 * By default (with only factory function), creates a singleton that always returns
 * the same instance regardless of parameters.
 *
 * When a key function is provided, uses it to determine which cached instance to return,
 * allowing for parameter-based caching.
 *
 * The factory must return a value with a dispose() method for proper cleanup.
 *
 * @param factory - The factory function to memoize (must return Disposable)
 * @param getKey - Optional function to extract cache key from parameters
 *
 * @example
 * // Singleton (default) - always returns same instance
 * const ensureDashboard = ensure(() => new DashboardState());
 *
 * // Key-based caching - different keys get different instances
 * const ensureProfile = ensure(
 *   (userId) => new ProfileState(userId),
 *   (userId) => userId  // Use userId as cache key
 * );
 */
export function ensure<T extends (...params: any[]) => Disposable>(
  factory: T,
  getKey?: (...params: Parameters<T>) => any
): MemoFactory<T> {
  const cache = new Map<any, ReturnType<T>>();
  let singletonInstance: ReturnType<T> | undefined;

  const memoFactory = ((...params: Parameters<T>): ReturnType<T> => {
    if (getKey) {
      // Use custom key function for parameter-based caching
      const key = getKey(...params);
      const existing = cache.get(key);

      if (existing !== undefined) {
        return existing;
      }

      const value = factory(...params) as ReturnType<T>;
      cache.set(key, value);
      return value;
    } else {
      // Default: singleton - always return the same instance
      if (singletonInstance === undefined) {
        singletonInstance = factory(...params) as ReturnType<T>;
      }
      return singletonInstance;
    }
  }) as MemoFactory<T>;

  // Add dispose method to clean up all cached instances
  memoFactory.dispose = () => {
    if (getKey) {
      for (const value of cache.values()) {
        value.dispose();
      }
      cache.clear();
    } else {
      if (singletonInstance !== undefined) {
        singletonInstance.dispose();
        singletonInstance = undefined;
      }
    }
  };

  // Mark with symbol for proxy detection
  Object.defineProperty(memoFactory, ENSURE_SYMBOL, {
    value: true,
    enumerable: false,
  });

  return memoFactory;
}
