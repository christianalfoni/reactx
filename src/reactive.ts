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
  const proxy = createProxy(
    target,
    true // Object.keys(_devHooks).length
      ? {
          path: [],
          hooks: {
            onActionEnd: console.log,
            onActionStart: console.log,
            onComputed: console.log,
            onMutation: console.log,
            onServiceCall: console.log,
            onStateChange: console.log,
          } satisfies DevHooks,
        }
      : undefined,
  );

  // Dev-only: register with devtools.
  //
  // Two cases:
  //  1. Devtools already loaded (overlay script ran first) → register immediately.
  //  2. Devtools not yet loaded (app module ran before the injected script) →
  //     push onto a queue that devtools/index.ts drains on startup.
  //
  // In production neither global exists, so both branches are skipped with no
  // overhead.
  const devtools = (globalThis as any).__REACTX_DEVTOOLS__;
  if (devtools) {
    devtools.register(target, proxy);
  } else {
    const g = globalThis as any;
    (g.__REACTX_DEVTOOLS_QUEUE__ ??= []).push({ target, proxy });
  }

  return proxy;
}
