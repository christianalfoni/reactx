function adder(a: number, b: number) {
  return a + b;
}

function fetchCounter() {
  return new Promise<{ count: number }>((resolve) => {
    setTimeout(() => {
      resolve({
        count: 0,
      });
    }, Math.random() * 3000);
  });
}

export const utils = () => ({
  adder,
  fetchCounter,
});

export type Utils = ReturnType<typeof utils>;
