import { reactive } from "bonsify";
import type { Utils } from "./utils";

type ItemDTO = {
  id: string;
  count: number;
};

type Item = ReturnType<typeof Item>;

function Item(data: ItemDTO) {
  console.log("DATA", data);
  const item = reactive({
    ...data,
    increase() {
      item.count++;
    },
  });

  return item;
}

export function Counter(utils: Utils) {
  const items = reactive({});
  const counter = reactive({
    count: 0,
    get items() {
      return Object.values(items);
    },
    addItem() {
      const id = Date.now().toString();
      items[id] = Item({ id, count: 0 });
    },
    deleteItem(id: string) {
      delete items[id];
    },
    updateItem(id: string, count: number) {
      items[id].count = count;
    },
  });

  return reactive.readonly(counter);
}
