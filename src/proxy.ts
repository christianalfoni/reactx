/**
 * Cache for storing proxies to avoid recreating them for the same target
 * We use separate caches for mutable and readonly proxies
 */
const proxyCache = new WeakMap<any, any>();
const readonlyProxyCache = new WeakMap<any, any>();

let globalSnapshot = 0;
let notify = () => {};

export function getGlobalSnapshot() {
  return globalSnapshot;
}

export function subscribe(notifier: () => void) {
  notify = notifier;

  return () => {
    notify = () => {};
  };
}

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
type IteratingMethodHandler = (args: any[]) => void;

const iteratingArrayMethods: Record<string, IteratingMethodHandler> = {
  // Methods that take a callback as first argument
  map: (args) => {
    args[0] = createProxy(args[0], () => {});
  },
  filter: (args) => {
    args[0] = createProxy(args[0], () => {});
  },
  find: (args) => {
    args[0] = createProxy(args[0], () => {});
  },
  findIndex: (args) => {
    args[0] = createProxy(args[0], () => {});
  },
  forEach: (args) => {
    args[0] = createProxy(args[0], () => {});
  },
  some: (args) => {
    args[0] = createProxy(args[0], () => {});
  },
  every: (args) => {
    args[0] = createProxy(args[0], () => {});
  },

  // Methods that take initial value as second argument
  reduce: (args) => {
    args[1] = createProxy(args[1], () => {});
  },
  reduceRight: (args) => {
    args[1] = createProxy(args[1], () => {});
  },
};

/**
 * Base proxy handler with common trap implementations for both objects and arrays
 */
function createBaseProxyHandler(updateReference: () => void) {
  return {
    // Support checking if an object is a proxy
    has(target: any, key: string | symbol) {
      if (key === PROXY_TARGET) {
        return true;
      }
      return Reflect.has(target, key);
    },

    // Handle property setting with reactivity
    set(target: any, key: string | symbol, value: any) {
      const wasSet = Reflect.set(target, key, value);

      // Don't trigger notifications for symbol properties
      if (typeof key === "symbol" || !wasSet) {
        return wasSet;
      }

      updateReference();
      globalSnapshot++;
      notify?.();
      return wasSet;
    },

    // Handle property deletion with reactivity
    deleteProperty(target: any, key: string | symbol) {
      const wasDeleted = Reflect.deleteProperty(target, key);

      // Don't trigger notifications for symbol properties
      if (typeof key === "symbol" || !wasDeleted) {
        return wasDeleted;
      }

      updateReference();
      globalSnapshot++;
      notify?.();
      return wasDeleted;
    },
  };
}

/**
 * Creates a proxy for an array with reactive behavior
 */
function createArrayProxy(target: any[], updateReference: () => void) {
  const baseHandler = createBaseProxyHandler(updateReference);

  return new Proxy(target, {
    ...baseHandler,

    // Enhanced get trap for arrays to handle special array methods
    get(target: any[], key: string | symbol) {
      const result = Reflect.get(target, key);

      // Handle proxy target access
      if (key === PROXY_TARGET) {
        return { target };
      }

      // Handle iterator access
      if (key === Symbol.iterator) {
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
          const result = originalMethod.apply(target, args);

          // Clear readonly cache to ensure value comparison works correctly
          updateReference();
          globalSnapshot++;
          notify?.();

          return result;
        };
      }

      // Handle iterating array methods
      if (key in iteratingArrayMethods) {
        const originalMethod = target[key as any];
        const handler = iteratingArrayMethods[key as string];

        return (...args: any[]) => {
          const result = originalMethod.apply(
            target,
            [
              (...methodArgs: any[]) => {
                handler(methodArgs);
                return args[0](...methodArgs);
              },
            ].concat(args.slice(1))
          );

          return createProxy(result, () => {});
        };
      }

      // Recursively create proxies for nested objects
      return createProxy(result, () => {});
    },
  });
}

/**
 * Creates a proxy for an object with reactive behavior
 */
function createObjectProxy(target: object, updateReference: () => void) {
  const baseHandler = createBaseProxyHandler(updateReference);

  return new Proxy(target, {
    ...baseHandler,

    // Enhanced get trap for objects
    get(target: any, key: string | symbol) {
      const result = Reflect.get(target, key);

      // Handle proxy target access
      if (key === PROXY_TARGET) {
        return target;
      }

      // Handle iterator access
      if (key === Symbol.iterator) {
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

      // Recursively create proxies for nested objects
      return createProxy(result, () => {
        target[key] = Array.isArray(result) ? result.slice() : { ...result };
      });
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
export function createProxy<T>(target: T, updateReference: () => void): T {
  // Type guard for non-objects
  if (target === null || typeof target !== "object") {
    return target;
  }

  return createProxyInternal(target as object, updateReference) as T;
}

/**
 * Internal implementation of createProxy that works with objects
 * This separation allows us to maintain type safety while handling the proxy creation
 */
function createProxyInternal(
  target: object,
  updateReference: () => void
): object {
  // We've already checked for primitives in the public function

  // Handle already proxied objects
  if (PROXY_TARGET in target) {
    const cachedProxy = proxyCache.get(target[PROXY_TARGET]);

    if (cachedProxy) {
      return cachedProxy;
    }
  }

  // Create appropriate proxy based on target type
  const proxy = Array.isArray(target)
    ? createArrayProxy(target, updateReference)
    : createObjectProxy(target, updateReference);

  // Cache the proxy for future reuse
  proxyCache.set(target, proxy);

  return proxy;
}
