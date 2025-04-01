import { configure, makeAutoObservable } from "mobx";
import { createProxy } from "./readonly-proxy";
import { use } from "react";

configure({
  enforceActions: "never",
});

export function reactive<T extends Record<string, any>>(value: T): T {
  return makeAutoObservable(value);
}

function readonly<T extends Record<string, any>>(value: T): T {
  return createProxy(value);
}

function read<T>(value: Promise<T> | T): T {
  return value instanceof Promise ? use(value) : value;
}

reactive.readonly = readonly;
reactive.read = read;
