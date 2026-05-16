import {
  _getAdministration,
  computed,
  isObservable,
  isObservableArray,
  observable,
} from "mobx";
import {
  createBaseProxyHandler,
  isCustomClassInstance,
  PROXY_TARGET,
} from "./common";

/**
 * Shared proxy cache — maps raw target objects to their reactive proxy wrapper.
 */
export const proxyCache = new WeakMap<any, any>();

// ---------------------------------------------------------------------------
// Dev-mode method hook
// ---------------------------------------------------------------------------

/**
 * Optional interceptor for bound method calls on custom class instances.
 *
 * Set by `reactx/devtools` at startup; remains null in production so the
 * hot path is a single cheap property read with no extra allocations.
 *
 * Must be an object (not a plain exported `let`) so devtools can mutate it
 * — ES module live-binding exports are read-only from the consumer side.
 */
export type MethodInterceptor = (
  instanceName: string,
  methodName: string,
  invoke: (...args: unknown[]) => unknown
) => unknown;

export const _devHooks: { onMethod: MethodInterceptor | null } = {
  onMethod: null,
};

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
 * Disposes all autoruns registered against a target when it is GC'd.
 */
const autorunRegistry = new FinalizationRegistry(
  (disposers: Array<() => void>) => {
    for (const dispose of disposers) dispose();
  }
);

// ---------------------------------------------------------------------------
// Proxy builders
// ---------------------------------------------------------------------------

function createArrayProxy(target: any[], path: string[]) {
  const baseHandler = createBaseProxyHandler(target);

  return new Proxy(
    isObservableArray(target) ? _getAdministration(target).values_ : target,
    {
      ...baseHandler,
      get(_, key: string | symbol) {
        const result = Reflect.get(target, key);

        if (key === PROXY_TARGET) {
          return { target, path };
        }
        if (typeof key === "symbol") {
          return result;
        }
        if (mutatingArrayMethods.includes(key as string)) {
          return () => {
            throw new Error(`Cannot mutate a readonly array`);
          };
        }

        return createProxy(result, path.concat(String(key)));
      },
    }
  );
}

function createObjectProxy(target: object, path: string[]) {
  const baseHandler = createBaseProxyHandler(target);
  const isCustomClass = isCustomClassInstance(target);
  const baseTarget = isObservable(target)
    ? _getAdministration(target).target_
    : target;

  if (isCustomClass) {
    // `observedKeys` — keys already seen through the proxy (used for the fast
    //   cache-hit path in the get trap).
    // `boxedKeys`    — keys already backed by an observable.box (used only by
    //   ensureBoxed as a dedupe guard).
    //
    // They MUST be separate sets.  The get trap adds a key to `observedKeys`
    // before calling `ensureBoxed`, so if ensureBoxed reused `observedKeys` as
    // its guard it would always bail out and the property would never be boxed.
    const observedKeys = new Set<string>();
    const boxedKeys = new Set<string>();
    const boundMethods: Record<string, Function> = {};
    const autorunDisposers: Array<() => void> = [];

    autorunRegistry.register(baseTarget, autorunDisposers, autorunDisposers);

    // Boxes a plain own-property as an observable.box so that MobX can track
    // reads of it from within a computed (e.g. inside a getter).  Called lazily
    // on first proxy access AND eagerly for all own properties before a getter's
    // computed is set up — the latter lets us call getter.call(target) without
    // losing reactive tracking, and also avoids the TypeError that occurs when
    // a private field is accessed through a Proxy (private-field checks use the
    // WeakMap / [[PrivateFields]] of the real instance, not the proxy).
    const ensureBoxed = (propKey: string) => {
      if (boxedKeys.has(propKey)) return;
      const ownDesc = Object.getOwnPropertyDescriptor(baseTarget, propKey);
      // Only box plain value properties — getters/setters on the instance are
      // handled separately (they become MobX computed values).
      if (!ownDesc || !("value" in ownDesc)) return;
      boxedKeys.add(propKey);
      const instanceName = (baseTarget as any).constructor?.name ?? "Object";
      const boxedValue = observable.box(ownDesc.value, {
        name: `${instanceName}.${propKey}`,
      });
      Object.defineProperty(baseTarget, propKey, {
        configurable: true,
        enumerable: true,
        get() { return boxedValue.get(); },
        set(v) { boxedValue.set(v); },
      });
    };

    return new Proxy(baseTarget, {
      ...baseHandler,
      get(_: any, key: string | symbol) {
        if (key === PROXY_TARGET) {
          return { target, path };
        }
        if (typeof key === "symbol") {
          return Reflect.get(target, key);
        }
        if (boundMethods[key]) {
          return boundMethods[key];
        }
        if (observedKeys.has(key)) {
          return createProxy(
            Reflect.get(target, key),
            path.concat(key)
          );
        }

        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(target),
          key
        );

        observedKeys.add(key);

        if (descriptor && descriptor.get && !descriptor.set) {
          // Eagerly box every own property so that getter.call(target) — using
          // the real instance, not the proxy — can still have its observable
          // reads tracked by MobX.  This also means getters that use private
          // fields work correctly without any special-casing.
          for (const instanceKey of Object.keys(baseTarget)) {
            ensureBoxed(instanceKey);
          }

          const getter = descriptor.get;
          const instanceName = (target as any).constructor?.name ?? "Object";

          const computedValue = computed(
            () => {
              // Call on the real target, not the proxy.  All data properties are
              // now observable.box-backed, so MobX tracks them as dependencies.
              // Private fields work because `this` is the actual class instance.
              return getter.call(target);
            },
            { name: `${instanceName}.${key}` }
          );

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
          if (boundMethods[key]) return boundMethods[key];

          const instanceName =
            (baseTarget as any).constructor?.name ?? "Object";
          const bound = result.bind(baseTarget);

          // The wrapper reads _devHooks.onMethod at *call* time, not at
          // binding time, so devtools registered after first-access still works.
          boundMethods[key] = (...args: unknown[]) => {
            const hook = _devHooks.onMethod;
            return hook
              ? hook(instanceName, key, () => bound(...args))
              : bound(...args);
          };

          return boundMethods[key];
        }

        ensureBoxed(key);

        const value = Reflect.get(baseTarget, key);
        return createProxy(value, path.concat(key));
      },
    });
  }

  return new Proxy(baseTarget, {
    ...baseHandler,
    get(_: any, key: string | symbol) {
      const result = Reflect.get(target, key);

      if (key === PROXY_TARGET) {
        return { target, path };
      }
      if (typeof key === "symbol" || typeof result === "function") {
        return result;
      }

      return createProxy(result, path.concat(key));
    },
  });
}

export function createProxy<T extends Record<string, any>>(
  target: T,
  path: string[] = []
): T {
  if (
    target === null ||
    typeof target !== "object" ||
    (Object.prototype.toString.call(target) !== "[object Object]" &&
      !Array.isArray(target))
  ) {
    return target;
  }

  // @ts-ignore
  const unwrappedTarget = target[PROXY_TARGET]?.target ?? target;

  const cachedProxy = proxyCache.get(unwrappedTarget);
  if (cachedProxy) {
    return cachedProxy;
  }

  const proxy = Array.isArray(unwrappedTarget)
    ? createArrayProxy(unwrappedTarget, path)
    : createObjectProxy(unwrappedTarget, path);

  proxyCache.set(unwrappedTarget, proxy);
  return proxy;
}
