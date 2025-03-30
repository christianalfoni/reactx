import { allObservations, getCurrentObserver } from "./observer";

/**
 * Cache for storing proxies to avoid recreating them for the same target
 * We use separate caches for mutable and readonly proxies
 */
const proxyCache = new WeakMap<any, any>();
const readonlyProxyCache = new WeakMap<any, any>();

/**
 * Symbol used to access the proxy target and readonly state
 */
export const PROXY_TARGET = Symbol("PROXY_TARGET");

/**
 * Clears readonly proxy cache for targets affected by mutations
 * This ensures value comparison works correctly in React
 */
function clearReadonlyProxyCache(targets: any[]) {
  for (const target of targets) {
    readonlyProxyCache.delete(target);
  }
}

/**
 * Notifies all observers about changes to a target
 * Used when a property is set or deleted
 */
function notifyObservers(target: any, key: string | symbol, targets: any[]) {
  // Clear readonly cache to ensure value comparison works correctly
  clearReadonlyProxyCache(targets);

  const observers = allObservations.get(target);
  if (!observers) return;

  // Create a copy of observers to avoid issues if the set is modified during iteration
  const currentObservers = Array.from(observers);

  for (const observer of currentObservers) {
    // Notify about changes to the object itself
    observer.notify(target);

    // Notify about changes to the specific property if it's a string key
    if (typeof key === "string") {
      observer.notify(target, key);
    }
  }
}

/**
 * List of array methods that mutate the array
 */
const mutatingArrayMethods = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];

/**
 * Map of array methods that iterate over array elements
 * Each handler wraps the callback to ensure reactive behavior
 */
type IteratingMethodHandler = (
  args: any[],
  readonly: boolean,
  targets: any[]
) => void;

const iteratingArrayMethods: Record<string, IteratingMethodHandler> = {
  // Methods that take a callback as first argument
  map: (args, readonly, targets) => {
    args[0] = createProxy(args[0], readonly, targets);
  },
  filter: (args, readonly, targets) => {
    args[0] = createProxy(args[0], readonly, targets);
  },
  find: (args, readonly, targets) => {
    args[0] = createProxy(args[0], readonly, targets);
  },
  findIndex: (args, readonly, targets) => {
    args[0] = createProxy(args[0], readonly, targets);
  },
  forEach: (args, readonly, targets) => {
    args[0] = createProxy(args[0], readonly, targets);
  },
  some: (args, readonly, targets) => {
    args[0] = createProxy(args[0], readonly, targets);
  },
  every: (args, readonly, targets) => {
    args[0] = createProxy(args[0], readonly, targets);
  },

  // Methods that take initial value as second argument
  reduce: (args, readonly, targets) => {
    args[1] = createProxy(args[1], readonly, targets);
  },
  reduceRight: (args, readonly, targets) => {
    args[1] = createProxy(args[1], readonly, targets);
  },
};

/**
 * Base proxy handler with common trap implementations for both objects and arrays
 */
function createBaseProxyHandler(
  target: any,
  readonly: boolean,
  targets: any[]
) {
  return {
    // Track property enumeration
    ownKeys(target: any) {
      getCurrentObserver()?.observe(target);
      return Reflect.ownKeys(target);
    },

    // Track property descriptor access
    getOwnPropertyDescriptor(target: any, key: string | symbol) {
      if (typeof key === "string") {
        getCurrentObserver()?.observe(target, key);
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    },

    // Support checking if an object is a proxy
    has(target: any, key: string | symbol) {
      if (key === PROXY_TARGET) {
        return true;
      }
      return Reflect.has(target, key);
    },

    // Handle property setting with reactivity
    set(target: any, key: string | symbol, value: any) {
      if (readonly) {
        throw new Error(
          `Cannot mutate a readonly ${
            Array.isArray(target) ? "array" : "object"
          }`
        );
      }

      const wasSet = Reflect.set(target, key, value);

      // Don't trigger notifications for symbol properties
      if (typeof key === "symbol" || !wasSet) {
        return wasSet;
      }

      notifyObservers(target, key, targets);
      return wasSet;
    },

    // Handle property deletion with reactivity
    deleteProperty(target: any, key: string | symbol) {
      if (readonly) {
        throw new Error(
          `Cannot mutate a readonly ${
            Array.isArray(target) ? "array" : "object"
          }`
        );
      }

      const wasDeleted = Reflect.deleteProperty(target, key);

      // Don't trigger notifications for symbol properties
      if (typeof key === "symbol" || !wasDeleted) {
        return wasDeleted;
      }

      notifyObservers(target, key, targets);
      return wasDeleted;
    },
  };
}

/**
 * Creates a proxy for an array with reactive behavior
 */
function createArrayProxy(
  target: any[],
  readonly = false,
  targets: any[] = []
) {
  const baseHandler = createBaseProxyHandler(target, readonly, targets);

  return new Proxy(target, {
    ...baseHandler,

    // Enhanced get trap for arrays to handle special array methods
    get(target: any[], key: string | symbol) {
      const result = Reflect.get(target, key);

      // Handle proxy target access
      if (key === PROXY_TARGET) {
        return { target, readonly };
      }

      // Handle iterator access
      if (key === Symbol.iterator) {
        getCurrentObserver()?.observe(target);
        return result;
      }

      // Return symbols directly
      if (typeof key === "symbol") {
        return result;
      }

      // Handle mutating array methods
      if (mutatingArrayMethods.includes(key as string)) {
        const originalMethod = target[key as any];

        return (...args: any[]) => {
          if (readonly) {
            throw new Error(`Cannot mutate a readonly array`);
          }

          const result = originalMethod.apply(target, args);

          notifyObservers(target, "length", targets);

          return result;
        };
      }

      // Handle iterating array methods
      if (key in iteratingArrayMethods) {
        getCurrentObserver()?.observe(target);
        const originalMethod = target[key as any];
        const handler = iteratingArrayMethods[key as string];

        return (...args: any[]) => {
          const result = originalMethod.apply(
            target,
            [
              (...methodArgs: any[]) => {
                handler(methodArgs, readonly, targets.concat(target));
                return args[0](...methodArgs);
              },
            ].concat(args.slice(1))
          );

          return createProxy(result, readonly, targets);
        };
      }

      // Track property access
      getCurrentObserver()?.observe(target, key as string);

      // Recursively create proxies for nested objects
      return createProxy(result, readonly, targets);
    },
  });
}

/**
 * Creates a proxy for an object with reactive behavior
 */
function createObjectProxy(
  target: object,
  readonly = false,
  targets: any[] = []
) {
  // Observe the object itself to track enumeration operations
  getCurrentObserver()?.observe(target);

  const baseHandler = createBaseProxyHandler(target, readonly, targets);

  return new Proxy(target, {
    ...baseHandler,

    // Enhanced get trap for objects
    get(target: any, key: string | symbol) {
      const result = Reflect.get(target, key);

      // Handle proxy target access
      if (key === PROXY_TARGET) {
        return { target, readonly };
      }

      // Handle iterator access
      if (key === Symbol.iterator) {
        getCurrentObserver()?.observe(target);
        return result;
      }

      // Return symbols, functions, and promises directly
      if (
        typeof key === "symbol" ||
        typeof result === "function" ||
        (result && result instanceof Promise)
      ) {
        return result;
      }

      // Handle non-configurable properties
      const descriptor = Object.getOwnPropertyDescriptor(target, key);
      if (descriptor && !descriptor.configurable) {
        return result;
      }

      // Track property access
      getCurrentObserver()?.observe(target, key as string);

      // Recursively create proxies for nested objects
      return createProxy(result, readonly, targets);
    },
  });
}

/**
 * Creates a reactive proxy for an object or array
 * @param target The object to make reactive
 * @param readonly Whether the proxy should be readonly
 * @param targets Chain of parent targets for cache invalidation
 * @returns A reactive proxy of the target
 */
export function createProxy<T>(
  target: T,
  readonly = false,
  targets: any[] = []
): T {
  // Type guard for non-objects
  if (target === null || typeof target !== "object") {
    return target;
  }

  return createProxyInternal(target as object, readonly, targets) as T;
}

/**
 * Internal implementation of createProxy that works with objects
 * This separation allows us to maintain type safety while handling the proxy creation
 */
function createProxyInternal(
  target: object,
  readonly = false,
  targets: any[] = []
): object {
  // We've already checked for primitives in the public function

  // Handle already proxied objects
  if (PROXY_TARGET in target) {
    const proxyTarget: any = target[PROXY_TARGET];

    // If the proxy is in the same readonly state, return it
    if (proxyTarget.readonly === readonly) {
      return target;
    }

    // For readonly proxies, unwrap the target to create a new readonly proxy
    if (readonly && !proxyTarget.readonly) {
      target = proxyTarget.target;
    }
  }

  // Add current target to the chain for cache invalidation
  const newTargets = [...targets, target];

  // Check cache first to avoid creating duplicate proxies
  const cache = readonly ? readonlyProxyCache : proxyCache;
  const cachedProxy = cache.get(target);

  if (cachedProxy) {
    return cachedProxy;
  }

  // Create appropriate proxy based on target type
  const proxy = Array.isArray(target)
    ? createArrayProxy(target, readonly, newTargets)
    : createObjectProxy(target, readonly, newTargets);

  // Cache the proxy for future reuse
  cache.set(target, proxy);
  return proxy;
}
