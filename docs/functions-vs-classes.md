# Functions VS Classes

Comparing functions and classes has nothing to do with "which one is better". It is about surfacing how they differ and how they are similar. There is nothing you can do with a function that you can not do in a class, and the opposite. Their differences is more about ergonomics and what you feel most comfortable with.

The benefits of a **function** is:

- No keywords
- No `this` binding
- No constructor method
- It is a function, just like a component

The benefits of a **class** is:

- It has explicit private members
- It has explicit public members
- The class is also the type
- You can pass parent state to nested state using `this` in the constructor
- No explicit typing of self referencing `getters`

## Creating state

::: code-group

```ts [Functional]
export type CounterState = ReturnType<typeof CounterState>;

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
```

```ts [Object Oriented]
export class CounterState {
  count = 0;
  constructor() {
    reactive(this);
  }
  increase() {
    this.count++;
  }
}
```

:::

## Passing parameters

::: code-group

```ts [Functional]
export type CounterState = ReturnType<typeof CounterState>;

export function CounterState(initialState: number) {
  const state = reactive({
    count: initialState,
    increase,
  });

  return state;

  function increase() {
    state.count++;
  }
}
```

```ts [Object Oriented]
export class CounterState {
  count: number;
  constructor(initialState: number) {
    reactive(this);
    this.count = initialState;
  }
  increase() {
    this.count++;
  }
}
```

:::

## Private VS Public

::: code-group

```ts [Functional]
export type CounterState = ReturnType<typeof CounterState>;

function CounterState() {
  const state = reactive({
    count: 0,
    dispose,
  });

  let interval = setInterval(increase, 1000);

  return state;

  function increase() {
    state.count++;
  }

  function dispose() {
    clearInterval(interval);
  }
}
```

```ts [Object Oriented]
export class CounterState {
  count = 0;
  private interval: NodeJS.Timeout;
  constructor() {
    reactive(this);
    this.interval = setInterval(() => this.increase(), 1000);
  }
  dispose() {
    clearInterval(this.interval);
  }
  private increase() {
    this.count++;
  }
}
```

:::

## Nested state

::: code-group

```ts [Functional]
import { reactive } from "mobx-lite";

export type NestedState = ReturnType<typeof NestedState>;

function NestedState(counter: CounterState) {
  const nested = reactive({
    counter,
    localState: "foo",
  });

  return nested;
}

export type CounterState = ReturnType<typeof CounterState>;

function CounterState() {
  const counter = reactive({
    count: 0,
    increase,
    get nested() {
      return nested;
    },
  });
  const nested = NestedState(counter);

  return counter;

  function increase() {
    counter.count++;
  }
}
```

```ts [Object Oriented]
import { reactive } from "mobx-lite";

class NestedState {
  localState = "foo";
  constructor(public counter: CounterState) {
    reactive(this);
  }
}

class CounterState {
  count = 0;
  nested: NestedState;
  constructor() {
    this.nested = new NestedState(this);
    reactive(this);
  }
  increase() {
    this.count++;
  }
}
```

:::
