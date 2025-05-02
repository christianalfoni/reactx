import { configure, makeAutoObservable } from "mobx";
import * as query from "./query";
import * as mutation from "./mutation";
import { readonly } from "./readonly";

export { observer } from "mobx-react-lite";

configure({
  enforceActions: "never",
});

export namespace reactive {
  export type Query<T> = query.Query<T>;
  export type Mutation<T, P extends any[]> = mutation.Mutation<T, P>;
}

export const reactive: typeof makeAutoObservable & {
  readonly: typeof readonly;
  query: typeof query.query;
  mutation: typeof mutation.mutation;
} = Object.assign(makeAutoObservable, {
  readonly,
  query: query.query,
  mutation: mutation.mutation,
});
