import { createProxy } from "./proxy";

export { observer, Observer } from "./observer";

export function reactive<T extends Record<string, any>>(value: T): T {
  return createProxy(value);
}

function subscribe<T extends Record<string, any>>(
  value: T,
  notify: (snapshot: number) => void
): T {
  return createProxy(value, true);
}

reactive.subscribe = subscribe;
