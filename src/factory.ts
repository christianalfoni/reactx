export function factory<T>(factory: (id: string) => T) {
  const cache: Record<string, T> = {};

  return (id: string) => {
    if (!cache[id]) {
      cache[id] = factory(id);
    }

    return cache[id];
  };
}
