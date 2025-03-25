import { reactive } from ".";

export type DTO = {
  id: string;
};

export type Data<T extends DTO, K extends DTO> = {
  data: Record<string, T>;
  lookup: Record<string, K>;
  list: readonly K[];
};

export function data<T extends DTO, K extends DTO>(
  constr: (data: T) => K
): Data<T, K> {
  const view = reactive<K[]>([]);
  const lookup = reactive<Record<string, K>>({});
  const data = new Proxy<Record<string, T>>(
    {},
    {
      set(target, key, value) {
        const item = constr(value);
        lookup[key as string] = item;
        view.push(item);
        return Reflect.set(target, key, value);
      },
      deleteProperty(target, key) {
        const item = target[key as string];
        delete lookup[key as string];
        view.splice(
          view.findIndex((view) => view.id === item.id),
          1
        );

        return Reflect.deleteProperty(target, key);
      },
    }
  );

  return {
    data,
    lookup: reactive.readonly(lookup),
    list: reactive.readonly(view),
  };
}
