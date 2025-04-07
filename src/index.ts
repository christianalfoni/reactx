import { configure, makeAutoObservable } from "mobx";
import * as query from "./query";
import * as mutation from "./mutation";
import { readonly } from "./readonly";

configure({
  enforceActions: "never",
});

export namespace reactive {
  export type Query<T> = query.Query<T>;
  export type Mutation<
    T,
    P extends mutation.Params | void = void
  > = mutation.Mutation<T, P>;
}

export function reactive<T extends Record<string, any>>(value: T): T {
  return makeAutoObservable(value);
}

reactive.readonly = readonly;
reactive.query = query.query;
reactive.mutation = mutation.mutation;
