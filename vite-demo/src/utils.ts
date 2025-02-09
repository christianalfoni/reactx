function adder(a: number, b: number) {
  return a + b;
}

export const utils = {
  adder,
};

export type Utils = typeof utils;
