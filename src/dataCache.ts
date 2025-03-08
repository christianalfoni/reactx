export function createDataCache<T extends { data: any }, S>(
  create: (params: T) => S
): (params: T) => S {
  const cache = new WeakMap<T["data"], S>();

  return (params) => {
    if (!params.data) {
      throw new Error("You have to pass a data property to cache it");
    }

    let state = cache.get(params.data);

    if (!state) {
      state = create(params);
      cache.set(params.data, state);
    }

    return state;
  };
}
