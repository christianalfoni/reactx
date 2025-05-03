import { configure } from "mobx";
import * as query from "./query";
import * as mutation from "./mutation";

export { observer } from "mobx-react-lite";

configure({
  enforceActions: "never",
});

export { reactive } from "./reactive";
export { query } from "./query";
export type { Query } from "./query";
export { mutation } from "./mutation";
export type { Mutation } from "./mutation";
