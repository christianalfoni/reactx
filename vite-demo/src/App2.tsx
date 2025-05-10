import { reactive } from "mobx-lite";

class Effects {
  foo() {
    return "bar";
  }
}

class Test {
  count = 0;
  mips: string[] = [];
  constructor(private counter: Counter) {}
  async increase() {
    this.count++;
    this.mips.push("hoho");
    this.counter.increase();
  }
}

class Counter {
  private effects = new Effects();
  count = 0;
  test = new Test(this);
  increase() {
    this.count++;
    this.effects.foo();
  }
}

const todosState = reactive(new Counter());

export default function App2() {
  return (
    <>
      <h1
        onClick={() => {
          //   todosState.increase();
          todosState.test.increase();
        }}
      >
        App2 {todosState.count} {todosState.test.count}
      </h1>
      <ul>
        {todosState.test.mips.map((val, index) => (
          <li key={index}>{val}</li>
        ))}
      </ul>
    </>
  );
}
