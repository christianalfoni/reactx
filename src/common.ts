const classInstanceCache = new WeakMap<Function, boolean>();

export function isCustomClassInstance(obj: unknown) {
  if (obj === null || typeof obj !== "object") return false;

  const ctor = (obj as any).constructor;
  // no constructor → probably Object.create(null)
  if (typeof ctor !== "function") return false;

  if (classInstanceCache.has(ctor)) {
    return classInstanceCache.get(ctor)!;
  }

  const src = Function.prototype.toString.call(ctor);

  // 1) Exclude plain Object/Array/etc by native-code check
  // 2) Also ignore plain Object if someone subclassed Object without new syntax
  const result = !src.includes("[native code]") && ctor !== Object;

  classInstanceCache.set(ctor, result);
  return result;
}

/**
 * Symbol used to access the proxy target
 */
export const PROXY_TARGET = Symbol("PROXY_TARGET");

/**
 * Base proxy handler with common trap implementations
 */
export function createBaseProxyHandler(target: any): ProxyHandler<any> {
  return {
    set() {
      throw new Error(`Cannot mutate from React`);
    },
    deleteProperty() {
      throw new Error(`Cannot mutate from React`);
    },
    getOwnPropertyDescriptor(_: any, key: any) {
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
    getPrototypeOf() {
      return Reflect.getPrototypeOf(target);
    },
    ownKeys(): any {
      return Reflect.ownKeys(target);
    },
    has(_: any, key: any) {
      return Reflect.has(target, key);
    },
    isExtensible() {
      return false;
    },
    defineProperty(_, key, attrs) {
      return Reflect.defineProperty(target, key, attrs);
    },
    setPrototypeOf(_, v) {
      return Reflect.setPrototypeOf(target, v);
    },
  };
}
