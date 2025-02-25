# Core Patterns

State management at its core is about constructing objects that holds state and behavior. This state needs to be reactive for components to be able to observe changes.

## Reactive state

You can make any object reactive. Consuming reactive objects in components makes them optimally reconcile when what they access from the object changes.

```ts
import { reactive } from "bonsify";

export const counter = reactive({
  count: 0,
  increase() {
    counter.count++;
  },
});
```

## Factories

Classes are great for constructing objects and organizing related state and behaviors. If you prefer using classes, please do, but the factory pattern gives you the same benefits with less keywords and concepts.

```ts
import { reactive } from "bonsify";

export function createCounter() {
  const counter = reactive({
    count: 0,
    increase() {
      counter.count++;
    },
  });

  return counter;
}
```

Now you can pass in dependencies:

```ts
import { reactive } from "bonsify";

export function createCounter(initialCount) {
  const counter = reactive({
    count: initialCount,
    increase() {
      counter.count++;
    },
  });

  return counter;
}
```

You can define private variables:

```ts
import { reactive } from "bonsify";

export function createCounter(initialCount) {
  const count = initialCount || 10;

  const counter = reactive({
    count,
    increase() {
      counter.count++;
    },
  });

  return counter;
}
```

You can separate behavior from state:

```ts
import { reactive } from "bonsify";

export function createCounter(initialCount) {
  const counter = reactive({
    count: initialCount,
    increase,
  });

  return counter;

  function increase() {
    counter.count++;
  }
}
```

This pattern is very useful as the complexity increases. Think about everything before the `return` as the `constructor` of a class, and everything after as the `methods` of a class. But unlike a class there is no `this` reference, you just point directly to any dependencies, variables or functions you want to use.

## Nesting and composing

Separating objects and factories and composing them back together makes your code more readable, increases reusability and improves testability.

You can compose by simply:

```ts
import { reactive } from "bonsify";

function createCounter() {
  const counter = reactive({
    count: 0,
    increase() {
      counter.count++;
    },
  });

  return counter;
}

export const state = reactive({
  counter: createCounter(),
});
```

## Passing parent references

When nesting state it can be useful to pass the parent reference. This can be achieved by using a `getter`. Also attaching the parent reference to the nested state itself is useful as components can more easily walk back up the state if needed.

```ts
import { reactive } from "bonsify";

function createDoubler(counter) {
  const doubler = reactive({
    counter,
    get double() {
      return counter.count * 2;
    },
  });

  return doubler;
}

export function createCounter() {
  const counter = reactive({
    count: 0,
    get doubler() {
      return doubler;
    },
    increase() {
      this.count++;
    },
  });

  const doubler = createDoubler(counter);

  return counter;
}
```

## Deriving state

JavaScript has a concept of deriving state in objects:

```ts
import { reactive } from "bonsify";

export function createCounter() {
  const counter = reactive({
    count: 0,
    get double() {
      return counter.count * 2;
    },
    increase() {
      counter.count++;
    },
  });

  return counter;
}
```

Using `getters` you can derive state. You can argue that primitives like `computed` will also cache the derived state, but how often is the cache actually used? When changing state you are typically looking at the derived UI of it. That means whatever `computed` you are using is always re-evaluating anyways.

So what do you do if you have expensive computation?

```ts
import { reactive } from "bonsify";

export function createCounter() {
  const counter = reactive({
    count: 0,
    double: 0,
    increase() {
      counter.count++;
      counter.double = expensiveDoubleComputation(counter.count);
    },
  });

  return counter;
}
```

You explicitly set the new value when needed. And then you might say; "but this double might go stale?". That is true, but is that a practical concern or a theoretical one? Also, `computed` recalculates as components consume the state, meaning the expensive computation happens during the rendering phase. You would rather want to have the freedom to run this expensive calculation when it makes sense.

## Disposing state

You might initialize state that creates a side effect that needs to be disposed of when you later remove the state.

```ts
function createCounter() {
  const counter = reactive({
    count: 0,
    dispose() {
      clearInterval(interval);
    },
  });

  const interval = setInterval(() => {
    counter.count++;
  }, 1000);

  return counter;
}

export function createState() {
  const state = reactive({
    createCounter() {
      state.counter = createCounter();
    },
    removeCounter() {
      state.counter?.dispose();
      delete state.counter;
    },
  });

  return state;
}
```

## Effects/Reactions

The promise of the the effect/reaction is to execute code when a state change occurs. Even though this is an appealing concept it has a really bad side effect, indirection.

```ts
const state = {
  count: 0,
  increase() {
    this.count++;
  },
};

effect(() => {
  console.log(state.count);
});
```

Whenever the `count` changes, the log statement appears. Indirection in this context means that when reading the `increase` code there is no way to know that it will also cause a log statement to happen. Reading the effect code you do not know where the `count` changes. As opposed to:

```ts
const state = {
  count: 0,
  increase() {
    this.count++;
    console.log(this.count);
  },
};
```

Reactions and effects are fundamentally bad constructs for state management. They do not improve your understanding of how your code executes and are not necessary. Even in scenarios where the `count` could change from multiple places and you want to centralise the log statement the indirection is not worth it, rather lift the logic into a function that changes the count and does the log.

> This mechanism is what enables components to observe changes and reconcile. Deriving state into UI makes a lot of sense, but managing state with reactions becomes confusing

## Guarantees and encapsulation

Defaulting to strong guarantees and encapsulation typically slows down development. For example Redux requires you to create an action,dispatch it and then resolve an immutable state change within a reducer. This encapsulates the state and gives some guarantees, but it slows you down. With **bonsify** we rather subscribe to an open and accessible model, where you as a developer and team create guarantees and encapsulations where it makes sense. An example of this would be:

```ts
function createItem(data) {
  const item = reactive({
    get id() {
      return data.id;
    },
    get completed() {
      return data.completed;
    },
    toggle() {
      data.completed = !data.completed;
    },
  });

  return item;
}
```

Now you have encapsulated the `data` of this item and created a guarantee that `toggle` has to be called to change the `completed` state of that data.

## Promises

You can choose to put promises into your state tree. This is especially valuable with React as you can suspend those promises in components.

The mental model for promises is often that they act as a temporary primitive that transfers a value from an asynchronous source and into a variable. Like:

```ts
// The promise is only there for as long as the data fetching runs
const data = await fetchData();
```

But promises does not disappear when it is resolved, the promise IS the value. So you can also say:

```ts
const asyncData = fetchData();
const data = await asyncData;
const dataAgain = await asyncData;
```

You can hold on to the promise and retrieve the value whenever you want. So for example we can have a promise of a counter and make it reactive:

```tsx
export const app = reactive({
  counter: fetchCounter().then(reactive),
  async increase() {
    // Just await the value to unwrap it
    const counter = await this.counter;
    counter.count++;
  },
});

// In a component
function Counter() {
  // Use Reacts use hook to unwrap it, using suspense
  const counter = use(app.counter);

  return <div>{counter.count}</div>;
}
```
