export declare function getGlobalSnapshot(): number;
export declare function subscribe(notifier: () => void): () => void;
/**
 * Symbol used to access the proxy target and readonly state
 */
export declare const PROXY_TARGET: unique symbol;
/**
 * Creates a reactive proxy for an object or array
 * @param target The object to make reactive
 * @param readonly Whether the proxy should be readonly
 * @param targets Chain of parent targets for cache invalidation
 * @returns A reactive proxy of the target
 */
export declare function createProxy<T>(target: T, updateReference: () => void): T;
