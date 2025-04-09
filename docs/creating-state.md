# Creating state

::: code-group

```ts [Functional]
import { reactive } from "mobx-lite";

export function CounterState(initialCount: number) {
  const state = reactive({
    count: initialCount,
    increase,
  });

  return state;

  function increase() {
    state.count++;
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
