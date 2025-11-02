export const ENSURE_SYMBOL = Symbol('reactx.ensure');

/**
 * Compares two parameter arrays for reference equality
 */
function paramsEqual(a: any[], b: any[]): boolean {
  return a.length === b.length && a.every((val, idx) => val === b[idx]);
}

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
 * Creates a memoized factory function that caches instances based on parameters.
 *
 * By default, uses reference equality to compare parameters. Optionally accepts
 * a key function to determine cache keys.
 *
 * The factory must return a value with a dispose() method for proper cleanup.
 *
 * @param factory - The factory function to memoize (must return Disposable)
 * @param getKey - Optional function to extract cache key from parameters
 *
 * @example
 * // Reference-based caching (default)
 * const createService = ensure((config) => new Service(config));
 *
 * // Custom key-based caching
 * const createUser = ensure(
 *   (id) => new User(id),
 *   (id) => id  // Use id as cache key
 * );
 */
export function ensure<T extends (...params: any[]) => Disposable>(
  factory: T,
  getKey?: (...params: Parameters<T>) => any
): MemoFactory<T> {
  const cache = new Map<any, ReturnType<T>>();
  const paramCache: Array<{ params: any[]; value: ReturnType<T> }> = [];

  const memoFactory = ((...params: Parameters<T>): ReturnType<T> => {
    if (getKey) {
      // Use custom key function
      const key = getKey(...params);
      const existing = cache.get(key);

      if (existing !== undefined) {
        return existing;
      }

      const value = factory(...params) as ReturnType<T>;
      cache.set(key, value);
      return value;
    } else {
      // Default: reference-based comparison
      const existing = paramCache.find(entry => paramsEqual(entry.params, params));

      if (existing) {
        return existing.value;
      }

      const value = factory(...params) as ReturnType<T>;
      paramCache.push({ params, value });
      return value;
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
      for (const entry of paramCache) {
        entry.value.dispose();
      }
      paramCache.length = 0;
    }
  };

  // Mark with symbol for proxy detection
  Object.defineProperty(memoFactory, ENSURE_SYMBOL, {
    value: true,
    enumerable: false,
  });

  return memoFactory;
}
