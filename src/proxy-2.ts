export const PROXY_IMMUTABLE_TARGET = Symbol("PROXY_IMMUTABLE_TARGET");
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
      return proxy[PROXY_IMMUTABLE_TARGET];
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
    target = target[PROXY_TARGET];
  }

  if (proxyCache.has(target)) {
    return proxyCache.get(target);
  }

  const isArray = Array.isArray(target);
  const subscriptions = new Set<() => void>();
  let immutableTarget = structuredClone(target);

  const subscribe = (update: () => void) => {
    subscriptions.add(update);
    return () => {
      subscriptions.delete(update);
    };
  };

  const emitSet = (key: string, value: unknown) => {
    immutableTarget = isArray
      ? (immutableTarget as any).slice()
      : { ...immutableTarget };
    immutableTarget[key] = value;

    emit();
  };

  const emitDelete = (key: string) => {
    immutableTarget = isArray
      ? (immutableTarget as any).slice()
      : { ...immutableTarget };
    delete immutableTarget[key];
    emit();
  };

  const emitArrayMutation = () => {
    immutableTarget = (immutableTarget as any).slice();
    emit();
  };

  const emit = () => {
    subscriptions.forEach((subscription) => {
      subscription();
    });

    emitParent(parentKey, immutableTarget);
  };

  const proxy = new Proxy(target, {
    has: (_, key) => {
      if (key === PROXY_IMMUTABLE_TARGET || key === PROXY_TARGET) {
        return true;
      }

      return Reflect.has(target, key);
    },
    get: (target, key) => {
      if (key === PROXY_IMMUTABLE_TARGET) {
        return immutableTarget;
      }

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
    set: (target, key, value) => {
      if (typeof key === "symbol") {
        return false;
      }

      emitSet(key, value);

      console.log("Set", key, value);

      return Reflect.set(target, key, value);
    },
    deleteProperty: (target, key) => {
      if (typeof key === "symbol") {
        return false;
      }

      emitDelete(key);

      return Reflect.deleteProperty(target, key);
    },
  });

  proxyCache.set(target, proxy);

  return proxy;
}
