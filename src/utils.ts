type Data = {
  id: string;
};

export function createDataCache<T extends { data: Data }, S>(
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

export function createDataLookup<T extends Data>(data: T[]) {
  return data.reduce((lookup, item) => {
    lookup[item.id] = item;
    return lookup;
  }, {} as Record<string, T>);
}
