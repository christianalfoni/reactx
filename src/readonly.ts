import { _getAdministration, isObservable } from "mobx";
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
function createBaseProxyHandler(target: any) {
  return {
    set() {
      throw new Error(
        `Cannot mutate a readonly ${Array.isArray(target) ? "array" : "object"}`
      );
    },

    // Handle property deletion with reactivity
    deleteProperty() {
      throw new Error(
        `Cannot mutate a readonly ${Array.isArray(target) ? "array" : "object"}`
      );
    },

    getOwnPropertyDescriptor(_: any, key: any) {
      return Reflect.getOwnPropertyDescriptor(target, key);
    },

    getPrototypeOf() {
      return Reflect.getPrototypeOf(target);
    },

    // Handle ownKeys trap to allow for iteration and property existence checks
    ownKeys(): any {
      return Reflect.ownKeys(target);
    },

    // Handle has trap to allow for property existence checks
    has(_: any, key: any) {
      return Reflect.has(target, key);
    },

    // Handle isExtensible trap to ensure readonly objects are not extensible
    isExtensible() {
      return false;
    },
  };
}

/**
 * Creates a proxy for an array with reactive behavior
 */
function createArrayProxy(target: any[]) {
  const baseHandler = createBaseProxyHandler(target);

  return new Proxy(
    isObservable(target) ? _getAdministration(target).target_ : target,
    {
      ...baseHandler,

      // Enhanced get trap for arrays to handle special array methods
      get(_, key: string | symbol) {
        const result = Reflect.get(target, key);

        if (key === PROXY_TARGET) {
          return target;
        }

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
    }
  );
}

/**
 * Creates a proxy for an object with reactive behavior
 */
function createObjectProxy(target: object) {
  const baseHandler = createBaseProxyHandler(target);

  return new Proxy(
    isObservable(target) ? _getAdministration(target).target_ : target,
    {
      ...baseHandler,

      // Enhanced get trap for objects
      get(_: any, key: string | symbol) {
        const result = Reflect.get(target, key);

        if (key === PROXY_TARGET) {
          return target;
        }

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
    }
  );
}

export function createProxy<T>(target: T): T {
  // Type guard for non-objects
  if (
    target === null ||
    typeof target !== "object" ||
    Object.prototype.toString.call(target) !== "[object Object]"
  ) {
    return target;
  }

  // @ts-ignore
  const unwrappedTarget = target[PROXY_TARGET] || target;

  const cachedProxy = proxyCache.get(unwrappedTarget);

  if (cachedProxy) {
    return cachedProxy;
  }

  // Create appropriate proxy based on target type
  const proxy = Array.isArray(unwrappedTarget)
    ? createArrayProxy(unwrappedTarget)
    : createObjectProxy(unwrappedTarget);

  // Cache the proxy for future reuse
  proxyCache.set(unwrappedTarget, proxy);

  return proxy;
}

export function readonly<T extends Record<string, any>>(value: T): T {
  return createProxy(value);
}
