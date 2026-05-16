import {
  _getAdministration,
  autorun,
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
import { DevContext } from "./devtools/types";

export const _devHooks = {};

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
function createArrayProxy(target: any[], devContext?: DevContext) {
  const baseHandler = createBaseProxyHandler(target);

  return new Proxy(
    isObservableArray(target) ? _getAdministration(target).values_ : target,
    {
      ...baseHandler,

      // Enhanced get trap for arrays to handle special array methods
      get(_, key: string | symbol) {
        const result = Reflect.get(target, key);

        if (key === PROXY_TARGET) {
          return { target, devContext };
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
        return createProxy(result, devContext);
      },
    },
  );
}

function createObjectMutationProxy(target: any, devContext?: DevContext) {
  if (
    target === null ||
    typeof target !== "object" ||
    Object.prototype.toString.call(target) !== "[object Object]"
  ) {
    return target;
  }

  return new Proxy(target, {
    get(target, key) {
      const result = Reflect.get(target, key);

      if (typeof key === "symbol") {
        return result;
      }

      if (typeof result === "function") {
        if (devContext) {
          return createActionProxy(target, key as string, result, devContext);
        }

        return Reflect.get(target, key);
      }

      if (isCustomClassInstance(result) && !proxyCache.has(result)) {
        if (devContext) {
          return createServiceProxy(result, key, devContext);
        }

        return Reflect.get(target, key);
      }

      const descriptor = Object.getOwnPropertyDescriptor(target, key);

      // Check if we are observing
      if (!descriptor?.set) {
        return result;
      }

      if (Array.isArray(result)) {
        if (devContext) {
          return createArrayDevtoolsProxy(result, key as string, devContext);
        }

        return createProxy(result);
      }

      if (typeof result === "object" && result !== null) {
        if (devContext) {
          return createObjectMutationProxy(result, {
            ...devContext,
            path: devContext.path.concat(key),
          });
        }

        return createProxy(result);
      }

      return result;
    },
    set(target, key, value) {
      const descriptor = Object.getOwnPropertyDescriptor(target, key);

      // We do not track mutations for properties not observed
      if (!descriptor?.set) {
        return Reflect.set(target, key, value);
      }

      descriptor.set.call(target, value);

      if (devContext) {
        devContext.hooks.onMutation({
          actionId: devContext.actionId!,
          mutation: {
            path: devContext.path.concat(key as string).join("."),
            operation: "set",
            args: [value],
          },
        });
      }

      return Reflect.set(target, key, value);
    },
  });
}

/**
 * Creates a proxy for an object with reactive behavior
 */
function createObjectProxy(target: object, devContext?: DevContext) {
  const baseHandler = createBaseProxyHandler(target);
  const isCustomClass = isCustomClassInstance(target);
  const baseTarget = isObservable(target)
    ? _getAdministration(target).target_
    : target;

  if (isCustomClass) {
    const observedKeys = new Set<string>();
    const boundMethods: Record<string, Function> = {};

    return new Proxy(baseTarget, {
      ...baseHandler,
      get(_: any, key: string | symbol) {
        if (key === PROXY_TARGET) {
          return { target, devContext };
        }

        if (typeof key === "symbol" || key.startsWith("isMobX")) {
          return Reflect.get(target, key);
        }

        if (boundMethods[key]) {
          return boundMethods[key];
        }

        if (observedKeys.has(key)) {
          return createProxy(
            Reflect.get(target, key),
            devContext
              ? {
                  ...devContext,
                  path: devContext.path.concat(key),
                }
              : devContext,
          );
        }

        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(target),
          key,
        );

        observedKeys.add(key);

        if (descriptor && descriptor.get && !descriptor.set) {
          const computedProxy = createProxy(
            baseTarget,
            devContext
              ? {
                  ...devContext,
                  path: devContext.path.concat(key),
                }
              : devContext,
          );
          const getter = descriptor.get;

          let evaluationCount = 0;

          const computedValue = computed(() => {
            const val = getter.call(computedProxy);

            if (devContext) {
              devContext.hooks.onComputed({
                path: devContext.path.concat(key),
                value: val,
                evaluationCount: evaluationCount++,
              });
            }

            return val;
          });

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
          if (devContext) {
            return (
              boundMethods[key] ||
              (boundMethods[key] = createActionProxy(
                baseTarget,
                key,
                result,
                devContext,
              ))
            );
          }

          return Reflect.get(target, key);
        }

        const boxedValue = observable.box(result);

        Object.defineProperty(baseTarget, key, {
          configurable: true,
          enumerable: true,
          get() {
            return boxedValue.get();
          },
          set(v) {
            boxedValue.set(v);
          },
        });

        let value = boxedValue.get();
        const proxyValue = createProxy(
          value,
          devContext
            ? { ...devContext, path: devContext.path.concat(key) }
            : devContext,
        );

        if (devContext) {
          let isFirstRun = true;
          const statePath = devContext.path.concat(key);
          autorun(() => {
            const newValue = boxedValue.get();

            // We do not update the actual class instance or array more than once or it will
            // overwrite existing state in the devtools
            if (
              !isFirstRun &&
              value === newValue &&
              isCustomClassInstance(value)
            ) {
              return;
            }

            devContext.hooks.onStateChange!({
              path: statePath,
              value: newValue,
            });

            value = newValue;

            isFirstRun = false;
          });
        }

        return proxyValue;
      },
    });
  }

  return new Proxy(baseTarget, {
    ...baseHandler,

    // Enhanced get trap for objects
    get(_: any, key: string | symbol) {
      const result = Reflect.get(target, key);

      if (key === PROXY_TARGET) {
        return { target, actionContext: devContext };
      }

      if (typeof key === "symbol" || typeof result === "function") {
        return result;
      }

      // Recursively create proxies for nested objects
      return createProxy(
        result,
        devContext
          ? { ...devContext, path: devContext.path.concat(key) }
          : devContext,
      );
    },
  });
}

export function createProxy<T extends Record<string, any>>(
  target: T,
  devContext?: DevContext,
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

  // Create appropriate proxy based on target type
  const proxy = Array.isArray(unwrappedTarget)
    ? createArrayProxy(unwrappedTarget, devContext)
    : createObjectProxy(unwrappedTarget, devContext);

  // Cache the proxy for future reuse
  proxyCache.set(unwrappedTarget, proxy);

  return proxy;
}

/**
 * DEVTOOL PROXIES
 */

function createServiceProxy(
  target: any,
  parentKey: string,
  devContext: DevContext,
) {
  return new Proxy(target, {
    get(_, key) {
      const result = Reflect.get(target, key);

      if (typeof result === "function") {
        return (...args: any[]) => {
          let funcResult;
          let error;

          try {
            funcResult = result.call(target, ...args);
          } catch (e) {
            error = e;
            throw e;
          } finally {
            devContext.hooks.onServiceCall!({
              actionId: devContext.actionId!,
              name: String(key),
              path: devContext.path.concat(parentKey),
              args,
              result: funcResult,
              error,
            });
          }

          return funcResult;
        };
      }
    },
  });
}

let currentActionId = 0;

function createActionProxy(
  target: any,
  key: string,
  func: Function,
  devContext: DevContext,
) {
  const actionId = `action-${currentActionId++}`;
  const actionName = devContext.path.concat(key).join(".");

  return new Proxy(func, {
    apply(_, __, args) {
      const startTime = performance.now();

      const proxy = createObjectMutationProxy(target, {
        ...devContext,
        actionId,
      });

      devContext.hooks.onActionStart({
        actionId,
        name: actionName,
        path: devContext.path.concat(key),
        args,
        parentActionId: devContext.actionId,
      });

      const result = Reflect.apply(func, proxy, args);

      if (result instanceof Promise) {
        result
          .then(() => {
            const duration = performance.now() - startTime;
            devContext.hooks.onActionEnd({
              actionId,
              duration,
            });
          })
          .catch((error) => {
            const duration = performance.now() - startTime;
            devContext.hooks.onActionEnd({
              actionId,
              duration,
              error,
            });
          });
      } else {
        const duration = performance.now() - startTime;
        devContext.hooks.onActionEnd({
          actionId,
          duration,
        });
      }

      return result;
    },
  });
}

function createArrayDevtoolsProxy(
  target: any,
  parentKey: string,
  devContext: DevContext,
) {
  return new Proxy(target, {
    // Enhanced get trap for arrays to handle special array methods
    get(_, key: string | symbol) {
      const result = Reflect.get(target, key);

      if (typeof key === "symbol") {
        return result;
      }

      // Handle mutating array methods
      if (mutatingArrayMethods.includes(key as string)) {
        return (...args: []) => {
          const val = result.call(target, ...args);
          devContext.hooks.onMutation({
            actionId: devContext.actionId!,
            mutation: {
              path: devContext.path.concat(parentKey as string).join("."),
              operation: key as any,
              args,
            },
          });

          return val;
        };
      }

      // Recursively create proxies for nested objects
      return createObjectMutationProxy(result, {
        ...devContext,
        path: devContext.path.concat(parentKey as string, key as string),
      });
    },
  });
}
