import {
  _getAdministration,
  autorun,
  computed,
  isObservable,
  observable,
} from "mobx";
import {
  createBaseProxyHandler,
  isCustomClassInstance,
  PROXY_TARGET,
} from "./common";
import { Devtools } from "./Devtool";

const devtool = new Devtools("MobX Lite");

console.log("Connecting to devtools");
devtool.connect("localhost:3031", (message) => {
  console.log("Devtools message", message);
});

devtool.send({
  type: "init",
  data: {
    state: {},
    actions: {},
    delimiter: ".",
  },
});

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
    isObservable(target) ? _getAdministration(target).target_ : target,
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

let currentEffectId = 0;

function createEffectsProxy(
  target: any,
  path: string[],
  execution: { actionId: string; executionId: string; operatorId: number }
) {
  return new Proxy(target, {
    get(_, key) {
      const effectId = currentEffectId++;
      const result = Reflect.get(target, key);

      if (typeof result === "function") {
        return (...args: any[]) => {
          const funcResult = result.call(target, ...args);

          devtool.send({
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
  let currentExecutionId = 0;

  return new Proxy(func, {
    apply(_, __, args) {
      console.log("Firing action", path);
      const executionId = `execution-${currentExecutionId++}`;
      const operatorId = 0;
      const proxy = createObjectMutationProxy(target, {
        path,
        executionId,
        actionId,
        operatorId,
      });
      devtool.send({
        type: "action:start",
        data: {
          actionId,
          executionId,
          actionName: path.concat(key).join("."),
          path: path,
          parentExecution,
        },
      });
      devtool.send({
        type: "operator:start",
        data: {
          actionId,
          executionId,
          operatorId,
          actionName: func.name,
          path: [],
          type: "action",
          parentExecution,
        },
      });
      const result = Reflect.apply(func, proxy, args);

      if (result instanceof Promise) {
        result
          .then(() => {
            devtool.send({
              type: "operator:end",
              data: {
                actionId,
                executionId,
                operatorId,
                isAsync: true,
              },
            });
            devtool.send({
              type: "action:end",
              data: {
                actionId,
                executionId,
              },
            });
          })
          .catch((error) => {
            devtool.send({
              type: "operator:end",
              data: {
                actionId,
                executionId,
                operatorId,
                isAsync: true,
                error,
              },
            });
            devtool.send({
              type: "action:end",
              data: {
                actionId,
                executionId,
              },
            });
          });
      } else {
        devtool.send({
          type: "operator:end",
          data: {
            actionId,
            executionId,
            operatorId,
            isAsync: false,
          },
        });
        devtool.send({
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

function createArrayMutationProxy(
  target: any,
  parentKey: string,
  options: {
    path: string[];
    executionId: string;
    actionId: string;
    operatorId: number;
  }
) {
  return new Proxy(target, {
    // Enhanced get trap for arrays to handle special array methods
    get(_, key: string | symbol) {
      const result = Reflect.get(target, key);

      // Handle mutating array methods
      if (mutatingArrayMethods.includes(key as string)) {
        return (...args: []) => {
          devtool.send({
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
        };
      }

      // Recursively create proxies for nested objects
      return result;
    },
  });
}

function createObjectMutationProxy(
  target: any,
  options: {
    path: string[];
    executionId: string;
    actionId: string;
    operatorId: number;
  }
) {
  return new Proxy(target, {
    get(target, key) {
      const result = Reflect.get(target, key);
      const proxyTarget = proxyCache.get(result);

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

      if (Array.isArray(result)) {
        return createArrayMutationProxy(result, key as string, options);
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
      devtool.send({
        type: "mutations",
        data: {
          actionId: options.actionId,
          executionId: options.executionId,
          operatorId: options.operatorId,
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

  if (isCustomClass) {
    const observedKeys = new Set<string>();
    const boundMethods: Record<string, Function> = {};

    return new Proxy(target, {
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

        const getter = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(target),
          key
        )?.get;

        observedKeys.add(key);

        if (getter) {
          const computedValue = computed(
            getter.bind(createProxy(target, path.concat(key)))
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
          // This should only be used in DEV
          return (
            boundMethods[key] ||
            (boundMethods[key] = createActionProxy(target, key, result, path))
          );
        }

        const boxedValue = observable.box(result);

        Object.defineProperty(target, key, {
          configurable: true,
          enumerable: true,
          get() {
            return boxedValue.get();
          },
          set(v) {
            boxedValue.set(v);
          },
        });

        const value = createProxy(boxedValue.get(), path.concat(key));

        let isFirstUpdate = true;

        autorun(() => {
          const val = boxedValue.get();

          // We do not update the actual class instance more than once or it will
          // overwrite existing state in the devtools
          if (!isFirstUpdate && isCustomClassInstance(val)) {
            return;
          }

          isFirstUpdate = false;

          devtool.send({
            type: "state",
            data: {
              path: path.concat(key),
              value: val,
            },
          });
        });

        return value;
      },
    });
  }

  return new Proxy(target, {
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

      devtool.send({
        type: "state",
        data: {
          path: path.concat(key),
          value: result,
        },
      });

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
    Object.prototype.toString.call(target) !== "[object Object]"
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
