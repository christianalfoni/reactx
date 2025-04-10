# reactive

::: code-group

```ts [Functional]
import { reactive } from "mobx-lite";

const state = reactive({
  count: 0,
  get computedDouble() {
    return state.count * 2;
  },
  increase() {
    state.count++;
  },
});
```

```ts [Object Oriented]
import { reactive } from "mobx-lite";

class State {
  count = 0;
  constructor() {
    reactive(this);
  }
  get computedDouble() {
    return this.count * 2;
  }
  increase() {
    this.count++;
  }
}
```

:::

Creates observable state, where `getters` becomes computed properties that are cached as long as they are observed.
