"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROXY_TARGET = void 0;
exports.getGlobalSnapshot = getGlobalSnapshot;
exports.subscribe = subscribe;
exports.createProxy = createProxy;
/**
 * Cache for storing proxies to avoid recreating them for the same target
 * We use separate caches for mutable and readonly proxies
 */
const proxyCache = new WeakMap();
const readonlyProxyCache = new WeakMap();
let globalSnapshot = 0;
let notify = () => { };
function getGlobalSnapshot() {
    return globalSnapshot;
}
function subscribe(notifier) {
    notify = notifier;
    return () => {
        notify = () => { };
    };
}
/**
 * Symbol used to access the proxy target and readonly state
 */
exports.PROXY_TARGET = Symbol("PROXY_TARGET");
/**
 * Clears readonly proxy cache for targets affected by mutations
 * This ensures value comparison works correctly in React
 */
function clearReadonlyProxyCache(targets) {
    for (const target of targets) {
        readonlyProxyCache.delete(target);
    }
}
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
const iteratingArrayMethods = {
    // Methods that take a callback as first argument
    map: (args) => {
        args[0] = createProxy(args[0]);
    },
    filter: (args) => {
        args[0] = createProxy(args[0]);
    },
    find: (args) => {
        args[0] = createProxy(args[0]);
    },
    findIndex: (args) => {
        args[0] = createProxy(args[0]);
    },
    forEach: (args) => {
        args[0] = createProxy(args[0]);
    },
    some: (args) => {
        args[0] = createProxy(args[0]);
    },
    every: (args) => {
        args[0] = createProxy(args[0]);
    },
    // Methods that take initial value as second argument
    reduce: (args) => {
        args[1] = createProxy(args[1]);
    },
    reduceRight: (args) => {
        args[1] = createProxy(args[1]);
    },
};
/**
 * Base proxy handler with common trap implementations for both objects and arrays
 */
function createBaseProxyHandler(updateReference) {
    return {
        // Support checking if an object is a proxy
        has(target, key) {
            if (key === exports.PROXY_TARGET) {
                return true;
            }
            return Reflect.has(target, key);
        },
        // Handle property setting with reactivity
        set(target, key, value) {
            const wasSet = Reflect.set(target, key, value);
            // Don't trigger notifications for symbol properties
            if (typeof key === "symbol" || !wasSet) {
                return wasSet;
            }
            updateReference();
            globalSnapshot++;
            notify === null || notify === void 0 ? void 0 : notify();
            return wasSet;
        },
        // Handle property deletion with reactivity
        deleteProperty(target, key) {
            const wasDeleted = Reflect.deleteProperty(target, key);
            // Don't trigger notifications for symbol properties
            if (typeof key === "symbol" || !wasDeleted) {
                return wasDeleted;
            }
            updateReference();
            globalSnapshot++;
            notify === null || notify === void 0 ? void 0 : notify();
            return wasDeleted;
        },
    };
}
/**
 * Creates a proxy for an array with reactive behavior
 */
function createArrayProxy(target, updateReference) {
    const baseHandler = createBaseProxyHandler(updateReference);
    return new Proxy(target, Object.assign(Object.assign({}, baseHandler), { 
        // Enhanced get trap for arrays to handle special array methods
        get(target, key) {
            const result = Reflect.get(target, key);
            // Handle proxy target access
            if (key === exports.PROXY_TARGET) {
                return { target };
            }
            // Handle iterator access
            if (key === Symbol.iterator) {
                return result;
            }
            // Return symbols directly
            if (typeof key === "symbol") {
                return result;
            }
            // Handle mutating array methods
            if (mutatingArrayMethods.includes(key)) {
                const originalMethod = target[key];
                return (...args) => {
                    const result = originalMethod.apply(target, args);
                    // Clear readonly cache to ensure value comparison works correctly
                    updateReference();
                    globalSnapshot++;
                    notify === null || notify === void 0 ? void 0 : notify();
                    return result;
                };
            }
            // Handle iterating array methods
            if (key in iteratingArrayMethods) {
                const originalMethod = target[key];
                const handler = iteratingArrayMethods[key];
                return (...args) => {
                    const result = originalMethod.apply(target, [
                        (...methodArgs) => {
                            handler(methodArgs);
                            return args[0](...methodArgs);
                        },
                    ].concat(args.slice(1)));
                    return createProxy(result);
                };
            }
            // Recursively create proxies for nested objects
            return createProxy(result);
        } }));
}
/**
 * Creates a proxy for an object with reactive behavior
 */
function createObjectProxy(target, updateReference) {
    const baseHandler = createBaseProxyHandler(updateReference);
    return new Proxy(target, Object.assign(Object.assign({}, baseHandler), { 
        // Enhanced get trap for objects
        get(target, key) {
            const result = Reflect.get(target, key);
            // Handle proxy target access
            if (key === exports.PROXY_TARGET) {
                return target;
            }
            // Handle iterator access
            if (key === Symbol.iterator) {
                return result;
            }
            // Return symbols, functions, and promises directly
            if (typeof key === "symbol" ||
                typeof result === "function" ||
                (result && result instanceof Promise)) {
                return result;
            }
            // Handle non-configurable properties
            const descriptor = Object.getOwnPropertyDescriptor(target, key);
            if (descriptor && !descriptor.configurable) {
                return result;
            }
            // Recursively create proxies for nested objects
            return createProxy(result, () => { });
        } }));
}
/**
 * Creates a reactive proxy for an object or array
 * @param target The object to make reactive
 * @param readonly Whether the proxy should be readonly
 * @param targets Chain of parent targets for cache invalidation
 * @returns A reactive proxy of the target
 */
function createProxy(target, updateReference) {
    // Type guard for non-objects
    if (target === null || typeof target !== "object") {
        return target;
    }
    return createProxyInternal(target, updateReference);
}
/**
 * Internal implementation of createProxy that works with objects
 * This separation allows us to maintain type safety while handling the proxy creation
 */
function createProxyInternal(target, updateReference) {
    // We've already checked for primitives in the public function
    // Handle already proxied objects
    if (exports.PROXY_TARGET in target) {
        const cachedProxy = proxyCache.get(target[exports.PROXY_TARGET]);
        if (cachedProxy) {
            return cachedProxy;
        }
    }
    // Create appropriate proxy based on target type
    const proxy = Array.isArray(target)
        ? createArrayProxy(target, updateReference)
        : createObjectProxy(target, updateReference);
    // Cache the proxy for future reuse
    proxyCache.set(target, proxy);
    return proxy;
}
//# sourceMappingURL=proxy.js.map