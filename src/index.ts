import { view } from "./view";
import { merge } from "./merge";
import { createProxy } from "./proxy";

export { observer, Observer } from "./observer";

export namespace reactive {
  export type Data<T extends { id: string }> = {
    data: Record<string, T>;
    list: readonly T[];
  };
}

export function reactive<T extends Record<string, any>>(value: T): T {
  return createProxy(value);
}

function readonly<T extends Record<string, any>>(value: T): T {
  return createProxy(value, true);
}

reactive.readonly = readonly;
reactive.merge = merge;
reactive.view = view;
