# Nested state

::: code-group

```ts [Functional]
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

export function State() {
  const state = reactive({
    counter: Counter(),
  });

  return reactive.readonly(state);
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

export class State {
  counter = new CounterState();
  constructor() {
    reactive(this);
  }
}

const state = reactive.readonly(new State());
```

:::

You can compose state as deep as you want.

## Disposing

Parent state might need to dispose of effects from its branches. This can be done simply by passing a set of disposers.

::: code-group

```ts [Functional]
import { reactive } from "mobx-lite";

function CounterState(disposers: Set<() => void>) {
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
  const disposers = new Set<() => void>();

  const state = reactive({
    counter: CounterState(disposers),
    dispose,
  });

  return reactive.readonly(state);

  function dispose() {
    disposers.forEach((dispose) => dispose());
  }
}
```

```ts [Object Oriented]
import { reactive } from "mobx-lite";

class CounterState {
  count = 0;
  constructor(disposers: Set<() => void>) {
    reactive(this);
    const interval = setInterval(() => this.increase(), 1000);

    disposers.add(() => clearInterval(interval));
  }
  increase() {
    this.count++;
  }
}

export class State {
  private disposers = new Set<() => void>();
  counter = new CounterState(this.disposers);
  constructor() {
    reactive(this);
  }
  dispose() {
    this.disposers.forEach((dipose) => dipose());
  }
}
```

:::
