import { configure, makeAutoObservable } from "mobx";
import { createProxy } from "./readonly-proxy";

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
