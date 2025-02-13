import { memo, useSyncExternalStore } from "react";

const proxyCache = new WeakMap<object, any>();
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

function createArrayProxy(target: any) {
  return new Proxy(target, {
    get(target, key) {
      const result = Reflect.get(target, key);

      if (typeof key === "symbol") {
        return result;
      }

      const isAccessingFunction = typeof result === "function";

      if (!isAccessingFunction) {
        return result;
      }

      if (mutatingArrayMethods.includes(key)) {
        const originMethod = target[key];
        const observers = allObservations.get(target);

        if (!observers) {
          return originMethod;
        }

        return (...args: any[]) => {
          const result = originMethod.apply(target, args);
          const currentObservers = Array.from(observers);

          for (const observer of currentObservers) {
            observer.notify(target);
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

      return result;
    },
    set(target, key, value) {
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

export function reactive<T extends Record<string, any>>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  const cachedProxy = proxyCache.get(value);

  if (cachedProxy) {
    return cachedProxy;
  }

  const proxy = new Proxy(value, {
    get(target, key) {
      const result = Reflect.get(target, key) as any;

      if (
        typeof key === "symbol" ||
        typeof result === "function" ||
        (result && result instanceof Promise)
      ) {
        return result;
      }

      const isAccessingArray = Array.isArray(result);

      if (isAccessingArray) {
        getCurrentObserver()?.observe(result);

        return createArrayProxy(result);
      }

      const descriptor = Object.getOwnPropertyDescriptor(target, key);

      if (descriptor && !descriptor.configurable) {
        // For non-configurable properties, return the raw value.
        return result;
      }

      getCurrentObserver()?.observe(target, key);

      return reactive(result);
    },
    set(target, key, value) {
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

  proxyCache.set(value, proxy);

  return proxy;
}
