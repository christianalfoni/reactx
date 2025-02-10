import { reactive } from "bonsify";
import type { Utils } from "./utils";

export const createCounter = (utils: Utils) =>
  reactive({
    count: 0,
    items: [] as Array<{ id: number; count: number; increase(): void }>,
    increase() {
      this.count = utils.adder(this.count, 1);
    },
    addItem() {
      this.items.push(
        reactive({
          id: this.items.length,
          count: 0,
          increase() {
            this.count++;
          },
        })
      );
    },
  });
