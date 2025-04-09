# Protected State

::: code-group

```ts [Functional]
import { reactive } from "mobx-lite";

function CounterState() {
  const state = reactive({
    count: 0,
    increase,
  });

  return reactive.readonly(state);

  function increase() {
    state.count++;
  }
}
```

```ts [Object Oriented]
import { reactive } from "mobx-lite";

class CounterState {
  count = 0;
  constructor() {
    reactive(this);
  }
  increase() {
    this.count++;
  }
}

const counter = reactive.readonly(new CounterState());
```

:::

::: warning

You can not define a class as `readonly` from its definition. You need to call `reactive.readonly` on the class instance.

:::

Mobx introduced the `action` to prevent mutations from React. This has caused headaches over the years as `async/await` was introduced to the language, resulting in yet another abstraction of `flow`. With **Mobx Lite** you rather expose your state reference as `readonly`. Now the consumer of your state can not make any changes, but everything inside your state scope can.
