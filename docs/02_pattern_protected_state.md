# Pattern: Protected State

Mobx introduced the `action` to prevent mutations from React. This has caused headaches over the years as `async/await` was introduced to the language, resulting in yet another abstraction of `flow`. With Mobx Reactive you rather expose your state reference as `readonly`. Now the consumer of your state can not make any changes, but everything inside your state scope can.

```ts
import { reactive } from "mobx-reactive";

function Counter() {
  const counter = reactive({
    count: 0,
    increase,
  });

  return reactive.readonly(counter);

  function increase() {
    counter.count++;
  }
}
```

You might be composing state where you can choose to protect or not:

```ts
import { reactive } from "mobx-reactive";

function Counter() {
  const counter = reactive({
    count: 0,
    increase,
  });

  return counter;

  function increase() {
    counter.count++;
  }
}

function State() {
  const counter = Counter();
  const state = reactive({
    counter,
    reset() {
      counter.count = 0;
    },
  });

  return reactive.readonly(state);
}
```

In this example the state exposed to components are all protected regardless, but `State` is still allowed to mutate the `Counter` state.
