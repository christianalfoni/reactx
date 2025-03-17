import { allObservations, getCurrentObserver } from "./observer";

const proxyCache = new WeakMap<any, any>();
const readonlyProxyCache = new WeakMap<any, any>();

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
  map: (args: any[], readonly: boolean) => {
    args[0] = createProxy(args[0], readonly);
  },
  filter: (args: any[], readonly: boolean) => {
    args[0] = createProxy(args[0], readonly);
  },
  reduce: (args: any[], readonly: boolean) => {
    args[1] = createProxy(args[1], readonly);
  },
  reduceRight: (args: any[], readonly: boolean) => {
    args[1] = createProxy(args[1], readonly);
  },
  find: (args: any[], readonly: boolean) => {
    args[0] = createProxy(args[0], readonly);
  },
  findIndex: (args: any[], readonly: boolean) => {
    args[0] = createProxy(args[0], readonly);
  },
  forEach: (args: any[], readonly: boolean) => {
    args[0] = createProxy(args[0], readonly);
  },
  some: (args: any[], readonly: boolean) => {
    args[0] = createProxy(args[0], readonly);
  },
  every: (args: any[], readonly: boolean) => {
    args[0] = createProxy(args[0], readonly);
  },
};

const PROXY_TARGET = Symbol("PROXY_TARGET");

function createArrayProxy(target: any, readonly = false) {
  // We also observe the array itself to track mutations
  getCurrentObserver()?.observe(target);

  return new Proxy(target, {
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

      if (typeof key === "symbol") {
        return result;
      }

      if (mutatingArrayMethods.includes(key)) {
        const originMethod = target[key];
        const observers = allObservations.get(target);

        if (!observers) {
          return originMethod;
        }

        return (...args: any[]) => {
          if (readonly) {
            throw new Error(`Cannot mutate a readonly array`);
          }

          const result = originMethod.apply(target, args);
          const currentObservers = Array.from(observers);

          for (const observer of currentObservers) {
            observer.notify(target);
            observer.notify(target, "length");
          }

          return result;
        };
      }

      if (key in iteratingArrayMethods) {
        const originMethod = target[key];
        // @ts-ignore
        const reactifier = iteratingArrayMethods[key];

        return (...args: any[]) => {
          return createProxy(
            originMethod.apply(
              target,
              [
                (...methodArgs: any[]) => {
                  reactifier(methodArgs, readonly);
                  return args[0](...methodArgs);
                },
              ].concat(args.slice(1))
            ),
            readonly
          );
        };
      }

      getCurrentObserver()?.observe(target, key);

      return createProxy(result, readonly);
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

      const observers = allObservations.get(target);

      if (observers) {
        const currentObservers = Array.from(observers);
        for (const observer of currentObservers) {
          observer.notify(target);
        }
      }

      return wasSet;
    },
  });
}

function createObjectProxy(target: any, readonly = false) {
  return new Proxy(target, {
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

      return createProxy(result, readonly);
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

      const observers = allObservations.get(target);

      if (observers) {
        const currentObservers = Array.from(observers);
        for (const observer of currentObservers) {
          observer.notify(target, key);
        }
      }

      return wasSet;
    },
  });
}

export function createProxy(target: unknown, readonly = false) {
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

  const cachedProxy = readonly
    ? readonlyProxyCache.get(target)
    : proxyCache.get(target);

  if (cachedProxy) {
    return cachedProxy;
  }

  let proxy;

  if (Array.isArray(target)) {
    proxy = createArrayProxy(target, readonly);
  } else {
    proxy = createObjectProxy(target, readonly);
  }

  if (readonly) {
    readonlyProxyCache.set(target, proxy);
  } else {
    proxyCache.set(target, proxy);
  }

  return proxy;
}
