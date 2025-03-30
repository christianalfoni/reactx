import { useSyncExternalStore } from "react";
import { Subscription } from "./proxy-2";
import { createProxy } from "./proxy";

export { state, createSubscription } from "./proxy-2";

export function useSubscription<T extends Record<string, any>>(
  subscription: Subscription<T>
): T {
  return useSyncExternalStore(
    subscription.subscribe,
    subscription.getSnapshot,
    subscription.getSnapshot
  );
}

export { observer, Observer } from "./observer";

export function reactive<T extends Record<string, any>>(value: T): T {
  return createProxy(value);
}

function readonly<T extends Record<string, any>>(value: T): T {
  return createProxy(value, true);
}

reactive.readonly = readonly;
