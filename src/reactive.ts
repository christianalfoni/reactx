import type { DevHooks } from "./devtools/types";
import { _devHooks, createProxy } from "./proxy";

/**
 * Wraps a class instance (or plain object) in a reactive proxy.
 *
 * All property reads and method calls are transparently tracked by MobX,
 * so any React component that reads reactive state will automatically
 * re-render when that state changes.
 */
export function reactive<T extends Record<string, any>>(target: T): T {
  const instanceName = (target as any)?.constructor?.name ?? "Object";

  return createProxy(target, {
    path: [instanceName],
    hooks: _devHooks as DevHooks,
  });
}
