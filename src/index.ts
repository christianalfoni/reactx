import { configure, makeAutoObservable } from "mobx";
import { query } from "./query";
import { mutation } from "./mutation";
import { readonly } from "./readonly";

configure({
  enforceActions: "never",
});

export function reactive<T extends Record<string, any>>(value: T): T {
  return makeAutoObservable(value);
}

reactive.readonly = readonly;
reactive.query = query;
reactive.mutation = mutation;
