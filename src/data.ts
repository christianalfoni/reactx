import { reactive } from ".";

export type Data<T extends { id: string }> = {
  data: Record<string, T>;
  list: readonly T[];
};

export function data<T extends { id: string }>(initialData?: T[]): Data<T> {
  const list = reactive<T[]>([]);
  const data = new Proxy<Record<string, T>>(
    {},
    {
      set(target, key, value) {
        list.push(value);
        return Reflect.set(target, key, value);
      },
      deleteProperty(target, key) {
        const item = target[key as string];

        list.splice(list.indexOf(item));

        return Reflect.deleteProperty(target, key);
      },
    }
  );

  if (initialData) {
    initialData.forEach((item) => {
      data[item.id] = item;
    });
  }

  return {
    data,
    list: reactive.readonly(list),
  };
}
