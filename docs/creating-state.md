# Creating state

::: code-group

```ts [Functional]
import { reactive } from "mobx-lite";

export type CounterState = ReturnType<typeof CounterState>;

export function CounterState(initialCount: number) {
  const counter = reactive({
    count: initialCount,
    increase,
  });

  return counter;

  function increase() {
    counter.count++;
  }
}
```

```ts [Object Oriented]
import { reactive } from "mobx-lite";

export class CounterState {
  count = 0;
  constructor(initialCount: number) {
    reactive(this);
    this.count = initialCount;
  }
  increase() {
    this.count++;
  }
}
```

:::
