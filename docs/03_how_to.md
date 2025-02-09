# How to

How can you possibly do any state management with a single primitive of `reactive`? Well, there is this magical construct we tend to forget when solving problems with abstractions... the language itself.

## Initialize state

```ts
import { reactive } from "bonsify";

export const counter = reactive({
  count: 0,
  increase() {
    this.count++;
  },
});
```

Ideally we would not need any primitive at all, but the JavaScript language currently does not provide any mechanism to create objects that can be observed for changes.

You can choose if you want to point to `this` or the returned reference:

```ts
import { reactive } from "bonsify";

export const counter = reactive({
  count: 0,
  increase() {
    counter.count++;
  },
});
```

## Dynamically initialize state

There are a few reasons for wanting to dynamically initialize your state:

- Pass in environment dependencies and/or configuration
- Rehydrate state from the server
- Testing

```ts
import { reactive } from "bonsify";

export const createCounter = (initialCount) =>
  reactive({
    count: initialCount,
    increase() {
      this.count++;
    },
  });
```

## Nesting and composing state

Nesting state is achieved by just nesting the object.

```ts
import { reactive } from "bonsify";

export const app = reactive({
  counter: {
    count: 0,
    increase() {
      this.count++;
    },
  },
});
```

You can compose by defining the state as a separate object:

```ts
import { reactive } from "bonsify";

const counter = reactive({
  count: 0,
  increase() {
    this.count++;
  },
});

export const app = reactive({
  counter,
});
```

Any time you define state with a reference, a variable, you should use `reactive`. This ensures that regardless of using `this` or the reference, you will be accessing the reactive reference.

## Deriving state

JavaScript has a concept of deriving state in objects:

```ts
import { reactive } from "bonsify";

export const app = reactive({
  count: 0,
  get double() {
    return this.initialCount * 2;
  },
  increase() {
    this.count++;
  },
});
```

Using `getters` you can derive state. You might argue that primitives like `computed` will also cache the derived state. That is true, but how much state do you really need to cache? In components you are already deriving most UI state without any caching and caching can only be defended by expensive computation.

So what do you do if you have expensive computation?

```ts
import { reactive } from "bonsify";

export const app = reactive({
  count: 0,
  double: 0,
  increase() {
    this.count++;
    this.double = expensiveDoubleComputation(this.count);
  },
});
```

You explicitly set the new value when needed. And then you might say; "but this might go stale?". That is true, but is that a theoretical concern or a practical one? Also, `computed` recalculates as components consume the state, meaning the expensive computation happens during the rendering phase. You would rather want to have the freedom to run this expensive calculation when it makes sense.

## Accessing parent state

When nesting state you might need access to parent state. This can be achieved by using a `getter`:

```ts
import { reactive } from "bonsify";

const createNested = (app) =>
  reactive({
    get double() {
      return app.count * 2;
    },
  });

export const createApp = () => {
  const app = reactive({
    count: 0,
    get nested() {
      return nested;
    },
    increase() {
      this.count++;
      this.double = expensiveDoubleComputation(this.count);
    },
  });

  const nested = createNested(app);

  return app;
};
```

## Persisting state

The great thing about state is that it is really JSON. The functions in the state tree will disappear if you serialize the state. So `JSON.stringify` can be performed in any part of the tree and you can also easily bring back persisted state by spreading it into your state. Here using a pseudo utility for persisting JSON:

```ts
import { reactive } from "bonsify";

export const createApp = (utils) => {
  const app = reactive({
    count: 0,
    increase() {
      this.count++;
    },
    hydrate() {
      return JSON.stringify(app);
    },
    rehydrate(appState) {
      Object.assign(app, appState);
    },
  });

  return app;
};
```

## Disposing state

You might initialize state that creates a side effect that needs to be disposed of when you later remove the state.

```ts
const createCounter = () => {
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
};

export const app = reactive({
  createCounter() {
    this.counter = createCounter();
  },
  removeCounter() {
    this.counter?.dispose();
    delete this.counter;
  },
});
```

## Effects/Reactions

The promise of the the react/effect is to execute code when a state change occurs. Even though this is an appealing concept it has a really bad side effect, indirection.

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

Reactions and effects are fundamentally bad constructs. They do not improve your understanding of how your code executes and are not necessary. Even in scenarios where the `count` could change from multiple places and you want to centralise the log statement the indirection is not worth it, rather lift the logic into a function that changes the count and does the log.
