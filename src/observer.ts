import { memo, useSyncExternalStore } from "react";

export const allObservations = new WeakMap<any, Set<Observer>>();
const observersStack: Observer[] = [];

export function getCurrentObserver() {
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

    for (const [target] of this.observations) {
      const allTargetObservations =
        allObservations.get(target) || new Set<Observer>();

      allTargetObservations.add(this);
      allObservations.set(target, allTargetObservations);
    }

    return () => {
      for (const [target] of this.observations) {
        const allTargetObservations = allObservations.get(target)!;

        allTargetObservations.delete(this);
      }
    };
  };
  observe(target: any, key?: string) {
    const targetObservations =
      this.observations.get(target) || new Set<string>();

    if (key) {
      targetObservations.add(key);
    }

    this.observations.set(target, targetObservations);
  }
  notify(target: any, key?: string) {
    if (key && !this.observations.get(target)?.has(key)) {
      return;
    }

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
