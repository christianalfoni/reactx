import { state } from "just-build-it";
import type { Utils } from "./utils";

export const createCounter = (utils: Utils) =>
  state({
    counter: {
      count: 0,
      increase() {
        this.count = utils.adder(this.count, 1);
      },
    },
  });
