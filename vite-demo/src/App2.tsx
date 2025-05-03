import { reactive } from "mobx-lite";

class Counter {
  count = 0;
  get double() {
    return this.count * 2;
  }
  increase() {
    this.count++;
  }
}

const counter = reactive(new Counter());

export default function App2() {
  return <h1 onClick={counter.increase}>Hello {counter.double}</h1>;
}
