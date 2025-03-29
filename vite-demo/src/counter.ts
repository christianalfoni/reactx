import { state } from "bonsify";

export type Counter = ReturnType<typeof Counter>;

export type Item = ReturnType<typeof Item>;

function Item() {
  const item = state({
    id: Date.now(),
    count: 0,
    increase() {
      item.count++;
    },
  });

  return item;
}

export function Counter() {
  const counter = state({
    items: [] as { test: Item }[],
    addItem() {
      counter.items.push({
        test: Item(),
      });
    },
    nested: {
      count: 0,
      increase() {
        counter.nested.count++;
      },
    },
  });

  console.log(counter);

  return counter;
}
