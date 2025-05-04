import { _getAdministration, computed, isObservable, observable } from "mobx";
import {
  createBaseProxyHandler,
  isCustomClassInstance,
  PROXY_TARGET,
} from "./common";

const proxyCache = new WeakMap<any, any>();

/**
 * Creates a proxy for an object with reactive behavior
 */
function createObjectProxy(target: object) {
  const baseHandler = createBaseProxyHandler(target);

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
        return getter.call(createImmutableProxy(target));
      }

      const result = Reflect.get(target, key);

      if (typeof result === "function") {
        return boundMethods[key] || (boundMethods[key] = result.bind(target));
      }

      const boxedValue = observable.box(result, { deep: false });

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

      return createImmutableProxy(boxedValue.get());
    },
  });
}

export function createImmutableProxy<T extends Record<string, any>>(
  target: T
): T {
  if (!isCustomClassInstance(target)) {
    return target;
  }

  // @ts-ignore
  const unwrappedTarget = target[PROXY_TARGET] || target;

  const cachedProxy = proxyCache.get(unwrappedTarget);

  if (cachedProxy) {
    return cachedProxy;
  }

  // Create appropriate proxy based on target type
  const proxy = createObjectProxy(unwrappedTarget);

  // Cache the proxy for future reuse
  proxyCache.set(unwrappedTarget, proxy);

  return proxy;
}
