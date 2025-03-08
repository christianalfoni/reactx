import { memo, useSyncExternalStore } from "react";

const proxyCache = new WeakMap<any, any>();
const readonlyProxyCache = new WeakMap<any, any>();
const allObservations = new WeakMap<any, Set<Observer>>();
const observersStack: Observer[] = [];

function getCurrentObserver() {
  return observersStack[observersStack.length - 1];
}

let globalSnapshot = 0;

export class Observer {
  private observations = new Map<any, Set<string>>();
  private snapshot = globalSnapshot;
  private onNotify?: () => void;
  getSnapshot = () => this.snapshot;
  subscribe = (onNotify: () => void) => {
    this.onNotify = onNotify;

    for (const [target] of this.observations) {
      const allTargetObservations =
        allObservations.get(target) || new Set<Observer>();

      allTargetObservations.add(this);
      allObservations.set(target, allTargetObservations);
    }

    return () => {
      for (const [target] of this.observations) {
        const allTargetObservations = allObservations.get(target)!;

        allTargetObservations.delete(this);
      }
    };
  };
  observe(target: any, key?: string) {
    const targetObservations =
      this.observations.get(target) || new Set<string>();

    if (key) {
      targetObservations.add(key);
    }

    this.observations.set(target, targetObservations);
  }
  notify(target: any, key?: string) {
    if (key && !this.observations.get(target)?.has(key)) {
      return;
    }

    this.snapshot = ++globalSnapshot;

    this.onNotify?.();
  }
  track() {
    observersStack.push(this);

    return () => {
      observersStack.pop();
    };
  }
}

export function observer(component: (...args: any[]) => any) {
  const observingComponent = memo((...args: any[]) => {
    const observer = new Observer();

    const untrack = observer.track();
    useSyncExternalStore(
      observer.subscribe,
      observer.getSnapshot,
      observer.getSnapshot
    );

    try {
      return component(...args);
    } finally {
      untrack();
    }
  });

  observingComponent.displayName = component.name || "ObservingComponent";

  return observingComponent;
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
  map: (args: any[]) => {
    args[0] = reactive(args[0]);
  },
  filter: (args: any[]) => {
    args[0] = reactive(args[0]);
  },
  reduce: (args: any[]) => {
    args[1] = reactive(args[1]);
  },
  reduceRight: (args: any[]) => {
    args[1] = reactive(args[1]);
  },
  find: (args: any[]) => {
    args[0] = reactive(args[0]);
  },
  findIndex: (args: any[]) => {
    args[0] = reactive(args[0]);
  },
  forEach: (args: any[]) => {
    args[0] = reactive(args[0]);
  },
  some: (args: any[]) => {
    args[0] = reactive(args[0]);
  },
  every: (args: any[]) => {
    args[0] = reactive(args[0]);
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
          return originMethod.apply(target, [
            (...methodArgs: any[]) => {
              reactifier(methodArgs);
              return args[0](...methodArgs);
            },
          ]);
        };
      }

      getCurrentObserver()?.observe(target, key);

      // @ts-expect-error
      return reactive(result, readonly);
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

function createProxy(target: unknown, readonly = false) {
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

    // But if we want want readonly and the proxy is not,
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

export function readonly<T extends Record<string, any>>(value: T): T {
  return createProxy(value, true);
}

export function reactive<T extends Record<string, any>>(value: T): T {
  return createProxy(value);
}

export function createDataCache<T extends { data: any }, S>(
  create: (params: T) => S
): (params: T) => S {
  const cache = new WeakMap<T["data"], S>();

  return (params) => {
    if (!params.data) {
      throw new Error("You have to pass a data property to cache it");
    }

    let state = cache.get(params.data);

    if (!state) {
      state = create(params);
      cache.set(params.data, state);
    }

    return state;
  };
}

export function merge<T extends Record<string, any>[]>(
  ...sources: T
): UnionToIntersection<T[number]> {
  // Create a merged proxy object
  const mergedProxy = new Proxy(
    {},
    {
      get(_, key: any) {
        // Look through all sources for the property
        for (const source of sources) {
          if (key in source) {
            const value = source[key];

            // Handle functions by binding them to their original source
            if (typeof value === "function") {
              return value.bind(source);
            }

            return value;
          }
        }

        return undefined;
      },
      set(target, key: any, value) {
        // Look through all sources for the property
        for (const source of sources) {
          if (key in source) {
            return (source[key] = value);
          }
        }

        return Reflect.set(target, key, value);
      },
      // Allow property existence checks
      has(_, key) {
        return sources.some((source) => key in source);
      },
      // Support Object.keys() and similar methods
      ownKeys() {
        const keys = new Set<string | symbol>();
        for (const source of sources) {
          Object.keys(source).forEach((key) => keys.add(key));
        }
        return Array.from(keys);
      },
      // Support property descriptors
      getOwnPropertyDescriptor(_, key: any) {
        for (const source of sources) {
          if (key in source) {
            // We must set configurable to true for the proxy to work
            return { configurable: true, enumerable: true, value: source[key] };
          }
        }
        return undefined;
      },
    }
  );

  // Make the merged object reactive
  return mergedProxy as any;
}

// Helper type for converting union types to intersection types
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;
