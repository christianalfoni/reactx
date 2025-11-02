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
export { async } from "./async";
export type { Async } from "./async";
export { ensure, ENSURE_SYMBOL } from "./ensure";
export type { Disposable } from "./ensure";
export { assign } from "./assign";

// Export observer types and implementations
export type {
  ReactiveObserver,
  ReactiveEvent,
  PropertyMutationData,
  PropertyTrackedData,
  ComputedEvaluatedData,
  ActionStartData,
  ActionEndData,
  ExecutionStartData,
  ExecutionEndData,
  InstanceMethodData,
  InitData,
} from "./events";
export type { ReactiveOptions } from "./proxy";
export { ConsoleObserver } from "./ConsoleObserver";
