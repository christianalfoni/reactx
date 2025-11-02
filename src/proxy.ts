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
import { ReactiveObserver } from "./events";
import { ENSURE_SYMBOL } from "./ensure";

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
function createArrayProxy(
  target: any[],
  path: string[],
  observer?: ReactiveObserver
) {
  const baseHandler = createBaseProxyHandler(target);

  return new Proxy(
    isObservableArray(target) ? _getAdministration(target).values_ : target,
    {
      ...baseHandler,

      // Enhanced get trap for arrays to handle special array methods
      get(_, key: string | symbol) {
        const result = Reflect.get(target, key);

        if (key === PROXY_TARGET) {
          return { target, path };
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
        return createProxy(result, [], observer);
      },
    }
  );
}

let pendingMutations: string[] = [];

function createObjectMutationProxy(
  target: any,
  options: {
    path: string[];
    executionId: string;
    actionId: string;
    actionName: string;
    operatorId: number;
    observer?: ReactiveObserver;
  }
) {
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
      const proxyTarget = proxyCache.get(result);

      if (typeof key === "symbol") {
        return result;
      }

      if (typeof result === "function") {
        return createActionProxy(
          target,
          key as string,
          result,
          options.path,
          options.observer,
          options
        );
      }

      if (isCustomClassInstance(result) && !proxyCache.has(result)) {
        return createEffectsProxy(
          result,
          options.path.concat(key as string),
          options
        );
      }

      const descriptor = Object.getOwnPropertyDescriptor(target, key);

      // Check if we are observing
      if (!descriptor?.set) {
        return result;
      }

      if (Array.isArray(result)) {
        return createArrayDevtoolsProxy(result, key as string, options);
      }

      if (typeof result === "object" && result !== null) {
        return createObjectMutationProxy(result, {
          ...options,
          path: proxyTarget ? proxyTarget[PROXY_TARGET].path : options.path,
        });
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
      pendingMutations.push(options.path.concat(key as string).join("."));
      options.observer?.onEvent({
        type: "property:mutated",
        data: {
          executionId: options.executionId,
          executionPath: options.path,
          mutations: [
            {
              propertyPath: options.path.concat(key as string).join("."),
              operation: "set",
              args: [value],
            },
          ],
        },
      });
      return Reflect.set(target, key, value);
    },
  });
}

/**
 * Creates a proxy for an object with reactive behavior
 */
function createObjectProxy(
  target: object,
  path: string[],
  observer?: ReactiveObserver
) {
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
            path.concat(key),
            observer
          );
        }

        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(target),
          key
        );

        observedKeys.add(key);

        if (descriptor && descriptor.get && !descriptor.set) {
          const computedProxy = createProxy(
            baseTarget,
            path.concat(key),
            observer
          );
          const getter = descriptor.get;

          let evaluationCount = 0;

          const computedValue = computed(() => {
            const val = getter.call(computedProxy);

            observer?.onEvent({
              type: "computed:evaluated",
              data: {
                path: path.concat(key),
                dependencies: [],
                value: val,
                evaluationCount: evaluationCount++,
              },
            });

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
          // Check if this is an ensure function - treat as lazy property, not action
          if (result[ENSURE_SYMBOL]) {
            return (
              boundMethods[key] ||
              (boundMethods[key] = (...args: any[]) => {
                const value = result(...args);

                // Track as property access, not action
                observer?.onEvent({
                  type: "property:tracked",
                  data: {
                    path: path.concat(key),
                    value,
                  },
                });

                return createProxy(value, path.concat(key), observer);
              })
            );
          }

          return (
            boundMethods[key] ||
            (boundMethods[key] = createActionProxy(
              baseTarget,
              key,
              result,
              path,
              observer
            ))
          );
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
        const proxyValue = createProxy(value, path.concat(key), observer);

        if (observer) {
          let isFirstRun = true;

          autorun(() => {
            const newValue = boxedValue.get();
            const statePath = path.concat(key);
            const mutationPath = statePath.join(".");
            const hasPendingMutation = pendingMutations.includes(mutationPath);

            if (hasPendingMutation) {
              pendingMutations.splice(
                pendingMutations.indexOf(mutationPath),
                1
              );

              return;
            }

            // We do not update the actual class instance or array more than once or it will
            // overwrite existing state in the devtools
            if (
              !isFirstRun &&
              value === newValue &&
              isCustomClassInstance(value)
            ) {
              return;
            }

            observer.onEvent({
              type: "property:tracked",
              data: {
                path: statePath,
                value: newValue,
              },
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
        return { target, path };
      }

      if (typeof key === "symbol" || typeof result === "function") {
        return result;
      }

      // Recursively create proxies for nested objects
      return createProxy(result, path.concat(key), observer);
    },
  });
}

export function createProxy<T extends Record<string, any>>(
  target: T,
  path: string[] = [],
  observer?: ReactiveObserver
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
    ? createArrayProxy(unwrappedTarget, path, observer)
    : createObjectProxy(unwrappedTarget, path, observer);

  // Cache the proxy for future reuse
  proxyCache.set(unwrappedTarget, proxy);

  return proxy;
}

export interface ReactiveOptions {
  observer?: ReactiveObserver;
}

export function reactive<T extends Record<string, any>>(
  target: T,
  options: ReactiveOptions = {}
) {
  return createProxy(target, [], options.observer);
}

/**
 * DEVTOOL PROXIES
 */

function createEffectsProxy(
  target: any,
  path: string[],
  execution: {
    actionId: string;
    actionName: string;
    executionId: string;
    operatorId: number;
    observer?: ReactiveObserver;
  }
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
            execution.observer?.onEvent({
              type: "instance:method",
              data: {
                methodName: String(key),
                methodPath: path,
                args,
                result: funcResult,
                error,
                executionId: execution.executionId,
              },
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
  path: string[],
  observer?: ReactiveObserver,
  parentExecution?: { operatorId: number }
) {
  const actionId = `action-${currentActionId++}`;
  const actionName = path.concat(key).join(".");
  let currentExecutionId = 0;

  return new Proxy(func, {
    apply(_, __, args) {
      const executionId = `execution-${currentExecutionId++}`;
      const operatorId = 0;
      const startTime = performance.now();
      const parentExecutionId = parentExecution
        ? `execution-${parentExecution.operatorId}`
        : undefined;

      const proxy = createObjectMutationProxy(target, {
        path,
        executionId,
        actionId,
        actionName,
        operatorId,
        observer,
      });

      observer?.onEvent({
        type: "action:start",
        data: {
          executionId,
          path: path.concat(key),
          args,
          parentExecutionId,
        },
      });

      observer?.onEvent({
        type: "execution:start",
        data: {
          executionId,
          name: func.name || key,
          path: path.concat(key),
          parentExecutionId,
        },
      });

      const result = Reflect.apply(func, proxy, args);

      if (result instanceof Promise) {
        result
          .then(() => {
            const duration = performance.now() - startTime;
            observer?.onEvent({
              type: "execution:end",
              data: {
                executionId,
                duration,
                isAsync: true,
              },
            });
            observer?.onEvent({
              type: "action:end",
              data: {
                executionId,
                duration,
              },
            });
          })
          .catch((error) => {
            const duration = performance.now() - startTime;
            observer?.onEvent({
              type: "execution:end",
              data: {
                executionId,
                duration,
                isAsync: true,
                error,
              },
            });
            observer?.onEvent({
              type: "action:end",
              data: {
                executionId,
                duration,
                error,
              },
            });
          });
      } else {
        const duration = performance.now() - startTime;
        observer?.onEvent({
          type: "execution:end",
          data: {
            executionId,
            duration,
            isAsync: false,
          },
        });
        observer?.onEvent({
          type: "action:end",
          data: {
            executionId,
            duration,
          },
        });
      }

      return result;
    },
  });
}

function createArrayDevtoolsProxy(
  target: any,
  parentKey: string,
  options: {
    path: string[];
    executionId: string;
    actionName: string;
    actionId: string;
    operatorId: number;
    observer?: ReactiveObserver;
  }
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
          options.observer?.onEvent({
            type: "property:mutated",
            data: {
              executionId: options.executionId,
              executionPath: options.path,
              mutations: [
                {
                  propertyPath: options.path.concat(parentKey as string).join("."),
                  operation: key as any,
                  args,
                },
              ],
            },
          });

          return val;
        };
      }

      // Recursively create proxies for nested objects
      return createObjectMutationProxy(result, {
        ...options,
        path: options.path.concat(parentKey as string, key as string),
      });
    },
  });
}
