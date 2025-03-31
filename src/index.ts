import { configure, makeAutoObservable } from "mobx";
import { createProxy } from "./readonly-proxy";
import { useRef } from "react";

configure({
  enforceActions: "never",
});

export function reactive<T extends Record<string, any>>(value: T): T {
  return makeAutoObservable(value);
}

function readonly<T extends Record<string, any>>(value: T): T {
  return createProxy(value);
}

reactive.readonly = readonly;

export function useReactive<T extends Record<string, any>>(cb: () => T): T {
  const reactiveRef = useRef<T>(null);

  if (!reactiveRef.current) {
    reactiveRef.current = reactive(cb());
  }

  return reactive.readonly(reactiveRef.current);
}
