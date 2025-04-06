# Functions VS Classes

Comparing functions and classes has nothing to do with "which one is better". It is about surfacing how they differ and how they are similar. There is nothing you can do with a function that you can not do in a class, and the opposite. Their differences is more about ergonomics and what you feel most comfortable with.

Let us look at a silly example that shows how functions and classes compare, where we focus on how we express the same state and behavior.

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

function CounterState(initialCount: number) {
  const subscribers = new Set<() => void>();
  const counter = reactive({
    count: initialCount,
    increase,
    subscribe,
    get nested() {
      return nested;
    },
  });
  const nested = NestedState(counter);

  setInterval(increaseDouble, 1000);

  return counter;

  function notify() {
    subscribers.forEach((subscriber) => subscriber());
  }

  function increaseDouble() {
    counter.count += 2;
    notify();
  }

  function increase() {
    counter.count++;
    notify();
  }

  function subscribe(subscriber: () => void) {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  }
}
```

```ts [Object Oriented]
import { reactive } from "mobx-lite";

class NestedState {
  localState = "foo";
  constructor(private counter: CounterState) {
    reactive(this);
  }
}

class CounterState {
  private subscribers = new Set<() => void>();
  count = 0;
  nested: NestedState;
  constructor(initialCount: number) {
    reactive(this);
    this.count = initialCount;
    this.nested = new NestedState(this);
    setInterval(() => this.increaseDouble(), 1000);
  }
  private increaseDouble() {
    this.count += 2;
    this.notify();
  }
  private notify() {
    this.subscribers.forEach((subscriber) => subscriber());
  }
  increase() {
    this.count++;
    this.notify();
  }
  subscribe(subscriber: () => void) {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }
}
```

:::

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
