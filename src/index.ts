import { configure, makeAutoObservable } from "mobx";
import * as query from "./query";
import * as mutation from "./mutation";
import { readonly } from "./readonly";

configure({
  enforceActions: "never",
});

export namespace reactive {
  export type Query<T> = query.Query<T>;
  export type Mutation<T, P extends any[]> = mutation.Mutation<T, P>;
}

export function reactive<T extends Record<string, any>>(
  ...params: Parameters<typeof makeAutoObservable>
) {
  return makeAutoObservable(...params) as T;
}

reactive.readonly = readonly;
reactive.query = query.query;
reactive.mutation = mutation.mutation;
