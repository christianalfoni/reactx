import { reactive } from "bonsify";
import type { Utils } from "./utils";

type ItemDTO = {
  id: string;
  count: number;
};

type Item = ReturnType<typeof Item>;

function Item(data: ItemDTO) {
  console.log("DATA", data);
  const item = reactive.merge(data, {
    increase() {
      data.count++;
    },
  });

  return item;
}

export function Counter(utils: Utils) {
  const items = reactive.view(Item);

  const counter = reactive({
    count: 0,
    items: items.view,
    addItem() {
      const id = Date.now().toString();
      items.data[id] = { id, count: 0 };
    },
    deleteItem(id: string) {
      delete items.data[id];
    },
    updateItem(id: string, count: number) {
      items.data[id].count = count;
    },
  });

  return reactive.readonly(counter);
}
