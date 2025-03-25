import { reactive } from ".";

export type DTO = {
  id: string;
};

export type Data<T extends DTO, K extends DTO> = {
  data: Record<string, T>;
  view: readonly K[];
};

export function data<T extends DTO, K extends DTO>(
  constr: (data: T) => K
): Data<T, K> {
  const view = reactive<K[]>([]);
  const data = new Proxy<Record<string, T>>(
    {},
    {
      set(target, key, value) {
        view.push(constr(value));
        return Reflect.set(target, key, value);
      },
      deleteProperty(target, key) {
        const item = target[key as string];
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
    view: reactive.readonly(view),
  };
}
