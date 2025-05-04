import { _getAdministration, computed, isObservable, observable } from "mobx";
import {
  createBaseProxyHandler,
  isCustomClassInstance,
  PROXY_TARGET,
} from "./common";

const proxyCache = new WeakMap<any, any>();

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
  const isCustomClass = isCustomClassInstance(target);

  if (isCustomClass) {
    const observedKeys = new Set<string>();
    const boundMethods: Record<string, Function> = {};

    return new Proxy(target, {
      ...baseHandler,
      get(_: any, key: string | symbol) {
        if (key === PROXY_TARGET) {
          return target;
        }

        if (typeof key === "symbol") {
          return Reflect.get(target, key);
        }

        if (boundMethods[key]) {
          return boundMethods[key];
        }

        if (observedKeys.has(key)) {
          return Reflect.get(target, key);
        }

        const getter = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(target),
          key
        )?.get;

        observedKeys.add(key);

        if (getter) {
          const computedValue = computed(getter.bind(createProxy(target)));

          Object.defineProperty(target, key, {
            configurable: true,
            enumerable: true,
            get() {
              return computedValue.get();
            },
          });

          return computedValue.get();
        }

        const result = Reflect.get(target, key);

        if (typeof result === "function") {
          return boundMethods[key] || (boundMethods[key] = result.bind(target));
        }

        const boxedValue = observable.box(result);

        Object.defineProperty(target, key, {
          configurable: true,
          enumerable: true,
          get() {
            return boxedValue.get();
          },
          set(v) {
            boxedValue.set(v);
          },
        });

        return createProxy(boxedValue.get());
      },
    });
  }

  return new Proxy(target, {
    ...baseHandler,

    // Enhanced get trap for objects
    get(_: any, key: string | symbol) {
      const result = Reflect.get(target, key);

      if (key === PROXY_TARGET) {
        return target;
      }

      if (typeof key === "symbol" || typeof result === "function") {
        return result;
      }

      // Recursively create proxies for nested objects
      return createProxy(result);
    },
  });
}

export function createProxy<T extends Record<string, any>>(target: T): T {
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
