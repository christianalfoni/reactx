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
import { Devtools } from "./Devtool";

let devtools: Devtools | undefined;

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
function createArrayProxy(target: any[], path: string[]) {
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
        return createProxy(result);
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
      devtools?.send({
        type: "mutations",
        data: {
          actionId: options.actionId,
          executionId: options.executionId,
          operatorId: options.operatorId,
          actionName: options.actionName,
          mutations: [
            {
              method: "set",
              delimiter: ".",
              path: options.path.concat(key as string).join("."),
              args: [value],
              // We update by obsercation
              hasChangedValue: false,
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
function createObjectProxy(target: object, path: string[]) {
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
          return createProxy(Reflect.get(target, key), path.concat(key));
        }

        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(target),
          key
        );

        observedKeys.add(key);

        if (descriptor && descriptor.get && !descriptor.set) {
          const computedProxy = createProxy(baseTarget, path.concat(key));
          const getter = descriptor.get;

          let updateCount = 0;

          const computedValue = computed(() => {
            const val = getter.call(computedProxy);

            devtools?.send({
              type: "derived",
              data: {
                path: path.concat(key),
                paths: [],
                value: val,
                updateCount: updateCount++,
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

        if (devtools && typeof result === "function") {
          return (
            boundMethods[key] ||
            (boundMethods[key] = createActionProxy(
              baseTarget,
              key,
              result,
              path
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
        const proxyValue = createProxy(value, path.concat(key));

        if (devtools) {
          const devtoolsInstance = devtools;

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

            devtoolsInstance.send({
              type: "state",
              data: {
                path: statePath,
                value: newValue,
                isMutation: !isFirstRun,
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

  // Create appropriate proxy based on target type
  const proxy = Array.isArray(unwrappedTarget)
    ? createArrayProxy(unwrappedTarget, path)
    : createObjectProxy(unwrappedTarget, path);

  // Cache the proxy for future reuse
  proxyCache.set(unwrappedTarget, proxy);

  return proxy;
}

export interface ReactiveOptions {
  devtools?: boolean | string;
}

export function reactive<T extends Record<string, any>>(
  target: T,
  options: ReactiveOptions = {}
) {
  if (options.devtools) {
    devtools = new Devtools("reactx");

    devtools.connect(
      typeof options.devtools === "string" ? options.devtools : "localhost:3031",
      () => {
        // TODO: Take state change messages and change internal state
      }
    );

    devtools.send({
      type: "init",
      data: {
        state: {},
        actions: {},
        delimiter: ".",
        features: {
          charts: false,
          transitions: false,
          components: false,
          flushes: false,
          runActions: false,
        },
      },
    });
  }

  return createProxy(target);
}

/**
 * DEVTOOL PROXIES
 */

let currentEffectId = 0;

function createEffectsProxy(
  target: any,
  path: string[],
  execution: {
    actionId: string;
    actionName: string;
    executionId: string;
    operatorId: number;
  }
) {
  return new Proxy(target, {
    get(_, key) {
      const effectId = currentEffectId++;
      const result = Reflect.get(target, key);

      if (typeof result === "function") {
        return (...args: any[]) => {
          const funcResult = result.call(target, ...args);

          devtools!.send({
            type: "effect",
            data: {
              effectId,
              actionId: execution.actionId,
              executionId: execution.executionId,
              operatorId: execution.operatorId,
              method: key,
              args,
              name: path.join("."),
              result: funcResult,
              isPending: false,
              error: null,
            },
          });

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
  parentExecution?: { operatorId: number }
) {
  const actionId = `action-${currentActionId++}`;
  const actionName = path.concat(key).join(".");
  let currentExecutionId = 0;

  return new Proxy(func, {
    apply(_, __, args) {
      const executionId = `execution-${currentExecutionId++}`;
      const operatorId = 0;
      const proxy = createObjectMutationProxy(target, {
        path,
        executionId,
        actionId,
        actionName,
        operatorId,
      });
      devtools!.send({
        type: "action:start",
        data: {
          actionId,
          executionId,
          actionName: path.concat(key).join("."),
          path: path,
          parentExecution,
          value: args,
        },
      });
      devtools!.send({
        type: "operator:start",
        data: {
          actionId,
          executionId,
          operatorId,
          name: func.name,
          path: [],
          type: "action",
          parentExecution,
        },
      });
      const result = Reflect.apply(func, proxy, args);

      if (result instanceof Promise) {
        result
          .then(() => {
            devtools!.send({
              type: "operator:end",
              data: {
                actionId,
                executionId,
                operatorId,
                isAsync: true,
              },
            });
            devtools!.send({
              type: "action:end",
              data: {
                actionId,
                executionId,
              },
            });
          })
          .catch((error) => {
            devtools!.send({
              type: "operator:end",
              data: {
                actionId,
                executionId,
                operatorId,
                isAsync: true,
                error,
              },
            });
            devtools!.send({
              type: "action:end",
              data: {
                actionId,
                executionId,
              },
            });
          });
      } else {
        devtools!.send({
          type: "operator:end",
          data: {
            actionId,
            executionId,
            operatorId,
            isAsync: false,
          },
        });
        devtools!.send({
          type: "action:end",
          data: {
            actionId,
            executionId,
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
          devtools!.send({
            type: "mutations",
            data: {
              actionId: options.actionId,
              executionId: options.executionId,
              operatorId: options.operatorId,
              mutations: [
                {
                  method: key,
                  delimiter: ".",
                  path: options.path.concat(parentKey as string).join("."),
                  args,
                  hasChangedValue: true,
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
