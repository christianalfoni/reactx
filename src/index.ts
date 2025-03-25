import { data, DTO } from "./data";
import { merge } from "./merge";
import { createProxy } from "./proxy";

export { observer, Observer } from "./observer";

export namespace reactive {
  export type Data<T extends DTO, K extends DTO> = {
    data: Record<string, T>;
    view: readonly K[];
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
reactive.data = data;
