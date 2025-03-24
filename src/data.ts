import { reactive } from ".";

export function data<T extends { id: string }>(initialData?: T[]) {
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
