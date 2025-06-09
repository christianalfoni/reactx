import { configure } from "mobx";

export { observer } from "mobx-react-lite";

configure({
  enforceActions: "never",
});

export { createImmutableProxy as immutableReactive } from "./immutableProxy";
export { reactive } from "./proxy";
export { query } from "./query";
export type { Query } from "./query";
export { mutation } from "./mutation";
export type { Mutation } from "./mutation";
