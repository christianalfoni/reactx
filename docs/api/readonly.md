# reactive.readonly

::: code-group

```ts [Functional]
import { reactive } from "mobx-lite";

const state = reactive({
  count: 0,
});

const readonlyState = reactive.readonly(state);
```

```ts [Object Oriented]
import { reactive } from "mobx-lite";

class State {
  count = 0;
  constructor() {
    reactive(this);
  }
}

const readonlyState = reactive.readonly(new State());
```

:::

Creates a `readonly` proxy which prevents any consumers from mutating the state.
