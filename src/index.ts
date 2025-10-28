import { configure } from "mobx";

export { observer } from "mobx-react-lite";

configure({
  enforceActions: "never",
});

import { reactive as reactiveImpl } from "./proxy";
import { createImmutableProxy } from "./immutableProxy";

export const reactive = Object.assign(reactiveImpl, {
  immutable: createImmutableProxy,
});

export { query } from "./query";
export type { Query } from "./query";
export { mutation } from "./mutation";
export type { Mutation } from "./mutation";
