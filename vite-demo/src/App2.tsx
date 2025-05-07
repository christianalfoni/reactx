import { reactive } from "mobx-lite";

class Test {
  count = 0;
  constructor(private counter: Counter) {}
  increase() {
    this.counter.count++;
  }
}

class Counter {
  count = 0;
  test = new Test(this);
  increase() {
    this.count++;
  }
}

const todosState = reactive(new Counter());

export default function App2() {
  return (
    <h1
      onClick={() => {
        //   todosState.increase();
        todosState.test.increase();
      }}
    >
      App2 {todosState.count} {todosState.test.count}
    </h1>
  );
}
