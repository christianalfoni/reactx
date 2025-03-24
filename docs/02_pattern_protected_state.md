# Pattern: Protected State

Protecting state prevents components from manipulating state in unpredictable ways. You rather force components to use the functions exposed from the public interface.

This is how **Bonsify** handles protecting state:

```ts
import { reactive } from "bonsify";

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

Now the `count` can not be changed from components.

You might be composing state where you can choose to protect or not:

```ts
import { reactive } from "bonsify";

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

In this examople the state exposed to components are all protected regardless, but `State` is still allowed to mutate the `Counter` state.
