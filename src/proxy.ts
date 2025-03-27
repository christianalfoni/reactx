import { allObservations, getCurrentObserver } from "./observer";

const proxyCache = new WeakMap<any, any>();
const readonlyProxyCache = new WeakMap<any, any>();

// We clear the readonly proxy cache for targets that has
// been effected by a mutation, which is a clever way
// to ensure value comparison is correct in React
function clearReadonlyProxyCache(targets: any[]) {
  for (const target of targets) {
    readonlyProxyCache.delete(target);
  }
}

const mutatingArrayMethods = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];

const iteratingArrayMethods = {
  map: (args: any[], readonly: boolean, targets: any[]) => {
    args[0] = createProxy(args[0], readonly, targets);
  },
  filter: (args: any[], readonly: boolean, targets: any[]) => {
    args[0] = createProxy(args[0], readonly, targets);
  },
  reduce: (args: any[], readonly: boolean, targets: any[]) => {
    args[1] = createProxy(args[1], readonly, targets);
  },
  reduceRight: (args: any[], readonly: boolean, targets: any[]) => {
    args[1] = createProxy(args[1], readonly, targets);
  },
  find: (args: any[], readonly: boolean, targets: any[]) => {
    args[0] = createProxy(args[0], readonly, targets);
  },
  findIndex: (args: any[], readonly: boolean, targets: any[]) => {
    args[0] = createProxy(args[0], readonly, targets);
  },
  forEach: (args: any[], readonly: boolean, targets: any[]) => {
    args[0] = createProxy(args[0], readonly, targets);
  },
  some: (args: any[], readonly: boolean, targets: any[]) => {
    args[0] = createProxy(args[0], readonly, targets);
  },
  every: (args: any[], readonly: boolean, targets: any[]) => {
    args[0] = createProxy(args[0], readonly, targets);
  },
};

export const PROXY_TARGET = Symbol("PROXY_TARGET");

function createArrayProxy(target: any, readonly = false, targets: any[] = []) {
  return new Proxy(target, {
    ownKeys(target) {
      getCurrentObserver()?.observe(target);
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(target, key) {
      if (typeof key === "string") {
        getCurrentObserver()?.observe(target, key);
      }

      return Reflect.getOwnPropertyDescriptor(target, key);
    },
    has(target, key) {
      const result = Reflect.has(target, key);

      if (key === PROXY_TARGET) {
        return true;
      }

      return result;
    },
    get(target, key) {
      const result = Reflect.get(target, key);

      if (key === PROXY_TARGET) {
        return { target, readonly };
      }

      if (key === Symbol.iterator) {
        getCurrentObserver()?.observe(target);
        return result;
      }

      if (typeof key === "symbol") {
        return result;
      }

      if (mutatingArrayMethods.includes(key)) {
        const originMethod = target[key];

        return (...args: any[]) => {
          if (readonly) {
            throw new Error(`Cannot mutate a readonly array`);
          }

          const result = originMethod.apply(target, args);

          clearReadonlyProxyCache(targets);

          const observers = allObservations.get(target);

          if (!observers) {
            return result;
          }

          const currentObservers = Array.from(observers);

          for (const observer of currentObservers) {
            observer.notify(target);
            observer.notify(target, "length");
          }

          return result;
        };
      }

      if (key in iteratingArrayMethods) {
        getCurrentObserver()?.observe(target);
        const originMethod = target[key];
        // @ts-ignore
        const reactifier = iteratingArrayMethods[key];

        return (...args: any[]) => {
          const result = originMethod.apply(
            target,
            [
              (...methodArgs: any[]) => {
                reactifier(methodArgs, readonly, targets.concat(target));
                return args[0](...methodArgs);
              },
            ].concat(args.slice(1))
          );

          return createProxy(result, readonly, targets);
        };
      }

      getCurrentObserver()?.observe(target, key);

      return createProxy(result, readonly, targets);
    },
    set(target, key, value) {
      if (readonly) {
        throw new Error(`Cannot mutate a readonly array`);
      }

      const wasSet = Reflect.set(target, key, value);

      if (typeof key === "symbol") {
        return wasSet;
      }

      if (!wasSet) {
        return wasSet;
      }

      clearReadonlyProxyCache(targets);

      const observers = allObservations.get(target);

      if (observers) {
        const currentObservers = Array.from(observers);
        for (const observer of currentObservers) {
          observer.notify(target);
          observer.notify(target, key);
        }
      }

      return wasSet;
    },
    deleteProperty(target, key) {
      if (readonly) {
        throw new Error(`Cannot mutate a readonly array`);
      }

      const wasDeleted = Reflect.deleteProperty(target, key);

      if (typeof key === "symbol") {
        return wasDeleted;
      }

      if (!wasDeleted) {
        return wasDeleted;
      }

      clearReadonlyProxyCache(targets);

      const observers = allObservations.get(target);

      if (observers) {
        const currentObservers = Array.from(observers);

        for (const observer of currentObservers) {
          observer.notify(target);
          observer.notify(target, key);
        }
      }

      return wasDeleted;
    },
  });
}

function createObjectProxy(target: any, readonly = false, targets: any[]) {
  // Observe the object itself to track enumeration operations like Object.values or for-of loops
  getCurrentObserver()?.observe(target);

  return new Proxy(target, {
    ownKeys(target) {
      getCurrentObserver()?.observe(target);
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(target, key) {
      if (typeof key === "string") {
        getCurrentObserver()?.observe(target, key);
      }

      return Reflect.getOwnPropertyDescriptor(target, key);
    },
    has(target, key) {
      const result = Reflect.has(target, key);

      if (key === PROXY_TARGET) {
        return true;
      }

      return result;
    },
    get(target, key) {
      const result = Reflect.get(target, key) as any;

      if (key === PROXY_TARGET) {
        return { target, readonly };
      }

      if (key === Symbol.iterator) {
        getCurrentObserver()?.observe(target);
        return result;
      }

      if (
        typeof key === "symbol" ||
        typeof result === "function" ||
        (result && result instanceof Promise)
      ) {
        return result;
      }

      const descriptor = Object.getOwnPropertyDescriptor(target, key);

      if (descriptor && !descriptor.configurable) {
        // For non-configurable properties, return the raw value.
        return result;
      }

      getCurrentObserver()?.observe(target, key);

      return createProxy(result, readonly, targets);
    },
    set(target, key, value) {
      if (readonly) {
        throw new Error("Cannot mutate a readonly object");
      }

      const wasSet = Reflect.set(target, key, value);

      if (typeof key === "symbol") {
        return wasSet;
      }

      if (!wasSet) {
        return wasSet;
      }

      clearReadonlyProxyCache(targets);

      const observers = allObservations.get(target);

      if (observers) {
        const currentObservers = Array.from(observers);

        for (const observer of currentObservers) {
          observer.notify(target);
          observer.notify(target, key);
        }
      }

      return wasSet;
    },
    deleteProperty(target, key) {
      if (readonly) {
        throw new Error("Cannot mutate a readonly object");
      }

      const wasDeleted = Reflect.deleteProperty(target, key);

      if (typeof key === "symbol") {
        return wasDeleted;
      }

      if (!wasDeleted) {
        return wasDeleted;
      }

      clearReadonlyProxyCache(targets);

      const observers = allObservations.get(target);

      if (observers) {
        const currentObservers = Array.from(observers);

        for (const observer of currentObservers) {
          observer.notify(target);
          observer.notify(target, key);
        }
      }

      return wasDeleted;
    },
  });
}

export function createProxy(
  target: unknown,
  readonly = false,
  targets: any[] = []
) {
  if (target === null || typeof target !== "object") {
    return target;
  }

  // If already a proxy
  if (PROXY_TARGET in target) {
    const proxyTarget: any = target[PROXY_TARGET];

    // If the proxy is in the same readonly state, we can just
    // return the proxy
    if (proxyTarget.readonly === readonly) {
      return target;
    }

    // But if we want readonly and the proxy is not,
    // we unwrap the target to create a new readonly proxy
    if (readonly && !proxyTarget.readonly) {
      target = proxyTarget.target;
    }
  }

  let newTargets = [...targets, target];

  const cachedProxy = readonly
    ? readonlyProxyCache.get(target)
    : proxyCache.get(target);

  if (cachedProxy) {
    return cachedProxy;
  }

  let proxy;

  if (Array.isArray(target)) {
    proxy = createArrayProxy(target, readonly, newTargets);
  } else {
    proxy = createObjectProxy(target, readonly, newTargets);
  }

  if (readonly) {
    readonlyProxyCache.set(target, proxy);
  } else {
    proxyCache.set(target, proxy);
  }

  return proxy;
}
