# Pattern: Nested State

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

export function State() {
  const state = reactive({
    counter: Counter(),
  });

  return reactive.readonly(state);
}
```

You can compose state as deep as you want.

## Disposing

Parent state might need to dispose of effects from its branches. This can be done simply by passing a set of disposers.

```ts
import { reactive } from "mobx-reactive";

function Counter({ disposers }) {
  const counter = reactive({
    count: 0,
  });

  const interval = setInterval(increase, 1000);

  disposers.add(() => clearInterval(interval));

  return counter;

  function increase() {
    counter.count++;
  }
}

export function State() {
  const disposers = new Set();

  const state = reactive({
    counter: Counter({ disposers }),
    dispose,
  });

  return reactive.readonly(state);

  function dispose() {
    disposers.forEach((dispose) => dispose());
  }
}
```
