import { reactive } from "bonsify";
import type { Utils } from "./utils";

type ItemDTO = {
  id: string;
  count: number;
};

type Item = ReturnType<typeof Item>;

function Item(data: ItemDTO) {
  const item = reactive({
    ...data,
  });

  return item;
}

export function Counter(utils: Utils) {
  const items = reactive.data<Item>();

  const counter = reactive({
    count: 0,
    items: items.list,
    addItem() {
      const id = Date.now().toString();
      items.data[id] = Item({ id, count: 0 });
    },
    deleteItem(id: string) {
      delete items.data[id];
    },
  });

  return reactive.readonly(counter);
}
