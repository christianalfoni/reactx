export const PROXY_TARGET = Symbol("PROXY_TARGET");
export const PROXY_SUBSCRIBE = Symbol("PROXY_SUBSCRIBE");
export const PROXY_CONNECT = Symbol("PROXY_CONNECT");

const proxyCache = new WeakMap<object, object>();

function isObject(value: unknown) {
  return typeof value === "object" && value !== null;
}

export type Subscription<T> = {
  subscribe(update: () => void): () => void;
  getSnapshot(): T;
};

export function createSubscription<T>(proxy: T): Subscription<T> {
  return {
    subscribe(update: () => void) {
      // @ts-ignore
      return proxy[PROXY_SUBSCRIBE](update);
    },
    getSnapshot(): T {
      // @ts-ignore
      return proxy[PROXY_TARGET];
    },
  };
}

export function state<T extends object>(value: T) {
  return createProxy(value, "", () => {}) as T;
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

function createProxy(
  target: any,
  parentKey: string,
  emitParent: (key: string, value: unknown) => void
) {
  if (!isObject(target)) {
    return target;
  }

  if (PROXY_TARGET in target) {
    // @ts-ignore
    target[PROXY_CONNECT](parentKey, emitParent);
  }

  if (proxyCache.has(target)) {
    return proxyCache.get(target);
  }

  const isArray = Array.isArray(target);
  const subscriptions = new Set<() => void>();

  const subscribe = (update: () => void) => {
    subscriptions.add(update);
    return () => {
      subscriptions.delete(update);
    };
  };

  const emitSet = (key: string, value: unknown) => {
    target = isArray ? target.slice() : { ...target };
    target[key] = value;
    emit();
  };

  const emitDelete = (key: string) => {
    target = isArray ? target.slice() : { ...target };
    delete target[key];
    emit();
  };

  const emitArrayMutation = () => {
    target = target.slice();
    emit();
  };

  const emit = () => {
    subscriptions.forEach((subscription) => {
      subscription();
    });

    emitParent(parentKey, target);
  };

  const proxy = new Proxy(
    {},
    {
      getOwnPropertyDescriptor: (_, key) => {
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
      has: (_, key) => {
        if (key === PROXY_TARGET) {
          return true;
        }

        return Reflect.has(target, key);
      },
      ownKeys: () => Reflect.ownKeys(target),
      get: (_, key) => {
        if (key === PROXY_TARGET) {
          return target;
        }

        if (key === PROXY_SUBSCRIBE) {
          return subscribe;
        }

        if (key === PROXY_CONNECT) {
          return (
            newParentKey: string,
            newEmitParent: (key: string, value: unknown) => void
          ) => {
            parentKey = newParentKey;
            emitParent = newEmitParent;
          };
        }

        const value = Reflect.get(target, key);

        if (typeof key === "symbol") {
          return value;
        }

        if (isArray && mutatingArrayMethods.includes(key)) {
          return (...args: any[]) => {
            args = args.map((arg) => createProxy(arg, key, emitSet));

            const result = value.apply(target, args);

            emitArrayMutation();

            return result;
          };
        }

        return createProxy(value, key, emitSet);
      },
      set: (_, key, value) => {
        if (typeof key === "symbol") {
          return false;
        }

        emitSet(key, value);

        return true;
      },
      deleteProperty: (_, key) => {
        if (typeof key === "symbol") {
          return false;
        }

        emitDelete(key);

        return true;
      },
    }
  );

  proxyCache.set(target, proxy);

  return proxy;
}
