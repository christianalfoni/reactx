# Hello World

::: code-group

```tsx [Functional]
import { reactive } from "mobx-lite";

function CounterState() {
  const state = reactive({
    count: 0,
    increase,
  });

  return state;

  function increase() {
    state.count++;
  }
}

const counter = CounterState();

function Counter() {
  return (
    <div>
      <span>{counter.count}</span>
      <button onClick={counter.increase}>Increase</button>
    </div>
  );
}
```

```tsx [Object Oriented]
import { reactive } from "mobx-lite";

export class CounterState {
  count = 0;
  constructor() {
    reactive(this);
  }
  increase() {
    this.count++;
  }
}

const counter = new CounterState();

function Counter() {
  return (
    <div>
      <span>{counter.count}</span>
      <button onClick={() => counter.increase()}>Increase</button>
    </div>
  );
}
```

:::
