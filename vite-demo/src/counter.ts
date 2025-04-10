import { reactive } from "bonsify";

export function Counter() {
  const counter = reactive({
    count: 0,
    increment,
  });

  return reactive.readonly(counter);

  function increment() {
    counter.count++;
  }
}
