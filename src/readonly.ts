/**
 * Cache for storing proxies to avoid recreating them for the same target
 * We use separate caches for mutable and readonly proxies
 */
const proxyCache = new WeakMap<any, any>();

/**
 * Symbol used to access the proxy target and readonly state
 */
export const PROXY_TARGET = Symbol("PROXY_TARGET");

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
 * Base proxy handler with common trap implementations for both objects and arrays
 */
function createBaseProxyHandler() {
  return {
    set(target: any) {
      throw new Error(
        `Cannot mutate a readonly ${Array.isArray(target) ? "array" : "object"}`
      );
    },

    // Handle property deletion with reactivity
    deleteProperty(target: any) {
      throw new Error(
        `Cannot mutate a readonly ${Array.isArray(target) ? "array" : "object"}`
      );
    },
  };
}

/**
 * Creates a proxy for an array with reactive behavior
 */
function createArrayProxy(target: any[]) {
  const baseHandler = createBaseProxyHandler();

  return new Proxy(target, {
    ...baseHandler,

    // Enhanced get trap for arrays to handle special array methods
    get(target: any[], key: string | symbol) {
      const result = Reflect.get(target, key);

      // Return symbols directly
      if (typeof key === "symbol") {
        return result;
      }

      // Handle mutating array methods
      if (mutatingArrayMethods.includes(key as string)) {
        return () => {
          throw new Error(`Cannot mutate a readonly array`);
        };
      }

      // Recursively create proxies for nested objects
      return createProxy(result);
    },
  });
}

/**
 * Creates a proxy for an object with reactive behavior
 */
function createObjectProxy(target: object) {
  const baseHandler = createBaseProxyHandler();

  return new Proxy(target, {
    ...baseHandler,

    // Enhanced get trap for objects
    get(target: any, key: string | symbol) {
      const result = Reflect.get(target, key);

      // Return symbols, functions, and promises directly
      if (typeof key === "symbol" || typeof result === "function") {
        return result;
      }

      // Handle non-configurable properties
      const descriptor = Object.getOwnPropertyDescriptor(target, key);

      if (descriptor && !descriptor.configurable) {
        return result;
      }

      // Recursively create proxies for nested objects
      return createProxy(result);
    },
  });
}

export function createProxy<T>(target: T): T {
  // Type guard for non-objects
  if (
    target === null ||
    typeof target !== "object" ||
    target instanceof Promise
  ) {
    return target;
  }

  // We've already checked for primitives in the public function

  const cachedProxy = proxyCache.get(target);

  if (cachedProxy) {
    return cachedProxy;
  }

  // Create appropriate proxy based on target type
  const proxy = Array.isArray(target)
    ? createArrayProxy(target)
    : createObjectProxy(target);

  // Cache the proxy for future reuse
  proxyCache.set(target, proxy);

  return proxy;
}

export function readonly<T extends Record<string, any>>(value: T): T {
  return createProxy(value);
}
