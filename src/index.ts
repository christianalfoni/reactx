import { memo, useSyncExternalStore } from "react";
import { a } from "vitest/dist/chunks/suite.BJU7kdY9";

const allObservations = new WeakMap<any, Record<string, Set<Observer>>>();
const observersStack: Observer[] = [];

function getCurrentObserver() {
  return observersStack[observersStack.length - 1];
}

let globalSnapshot = 0;

export class Observer {
  private observations = new Map<any, Set<string>>();
  private snapshot = globalSnapshot;
  private onNotify?: () => void;
  getSnapshot = () => this.snapshot;
  subscribe = (onNotify: () => void) => {
    this.onNotify = onNotify;

    const targets = Array.from(this.observations.keys());

    for (const target of targets) {
      const keys = this.observations.get(target)!;

      for (const key of keys) {
        const allTargetObservations = allObservations.get(target) || {};
        const targetObservers =
          allTargetObservations[key] || new Set<Observer>();

        targetObservers.add(this);
        allTargetObservations[key] = targetObservers;
        allObservations.set(target, allTargetObservations);
      }
    }

    return () => {
      for (const target of targets) {
        const keys = this.observations.get(target)!;

        for (const key of keys) {
          const allTargetObservations = allObservations.get(target)!;
          const targetObservers = allTargetObservations[key];

          targetObservers.delete(this);

          if (targetObservers.size === 0) {
            delete allTargetObservations[key];
          }

          allObservations.set(target, allTargetObservations);
        }
      }
    };
  };
  observe(target: any, key: string) {
    const targetObservations =
      this.observations.get(target) || new Set<string>();

    targetObservations.add(key);

    this.observations.set(target, targetObservations);
  }
  notify() {
    this.snapshot = ++globalSnapshot;

    this.onNotify?.();
  }
  track() {
    observersStack.push(this);

    return () => {
      observersStack.pop();
    };
  }
}

export function observer(component: (...args: any[]) => any) {
  const observingComponent = memo((...args: any[]) => {
    const observer = new Observer();

    const untrack = observer.track();
    useSyncExternalStore(
      observer.subscribe,
      observer.getSnapshot,
      observer.getSnapshot
    );

    try {
      return component(...args);
    } finally {
      untrack();
    }
  });

  observingComponent.displayName = component.name || "ObservingComponent";

  return observingComponent;
}

const mutatingArrayMethods = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];

export function reactive<T extends Record<string, any>>(value: T) {
  return new Proxy(value, {
    get(target, key) {
      const result = Reflect.get(target, key);

      if (typeof key === "symbol") {
        return result;
      }

      if (
        typeof target[key] === "function" &&
        Array.isArray(target) &&
        mutatingArrayMethods.includes(key as string)
      ) {
        const originMethod = target[key];
        const observers = allObservations.get(target)?.[key as string];

        if (!observers) {
          return originMethod;
        }

        return (...args: any[]) => {
          const result = originMethod.apply(target, args);
          const currentObservers = Array.from(observers);

          for (const observer of currentObservers) {
            observer.notify();
          }

          return result;
        };
      }

      getCurrentObserver()?.observe(target, key);

      if (result !== null && typeof result === "object") {
        return reactive(result);
      }
      return result;
    },
    set(target, key, value) {
      const wasSet = Reflect.set(target, key, value);

      if (typeof key === "symbol") {
        return wasSet;
      }

      if (!wasSet) {
        return wasSet;
      }

      const observers = allObservations.get(target)?.[key];

      if (observers) {
        const currentObservers = Array.from(observers);
        for (const observer of currentObservers) {
          observer.notify();
        }
      }

      return wasSet;
    },
  });
}
