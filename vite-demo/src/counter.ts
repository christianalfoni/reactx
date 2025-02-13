import { reactive } from "bonsify";
import type { Utils } from "./utils";

export const createApp = (utils: Utils) =>
  reactive({
    items: [] as Array<{
      id: number;
      increase(): void;
      counter: Promise<{ count: number }>;
    }>,
    addItem() {
      this.items.push(
        reactive({
          id: this.items.length,
          async increase() {
            const counter = await this.counter;
            counter.count++;
          },
          counter: utils.fetchCounter().then(reactive),
        })
      );
    },
  });
