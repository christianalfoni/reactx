import { useSyncExternalStore } from "react";
import { Subscription } from "./proxy-2";

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
