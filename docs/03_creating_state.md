# Creating state

How can you possibly do any state management with a single primitive of `reactive`? Well, there is this magical construct we tend to forget when solving problems with abstractions... the language itself.

## Defining state

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

## Constructing state

To go beyond just defining state, you can construct it. Plain objects does not have constructors like classes, but you can get the same functionality by simply creating a function.

```ts
import { reactive } from "bonsify";

export const createCounter = () => {
  return reactive({
    count: 0,
    increase() {
      this.count++;
    },
  });
};
```

By creating a function you can pass in dependencies:

```ts
import { reactive } from "bonsify";

export const createCounter = (initialCount) => {
  return reactive({
    count: initialCount,
    increase() {
      this.count++;
    },
  });
};
```

You can define private variables:

```ts
import { reactive } from "bonsify";

export const createCounter = (initialCount) => {
  const count = initialCount || 10;

  return reactive({
    count,
    increase() {
      this.count++;
    },
  });
};
```

You can separate functionality from definitions:

```ts
import { reactive } from "bonsify";

export const createCounter = (initialCount) => {
  const counter = reactive({
    count: initialCount,
    increase,
  });

  return counter;

  function increase() {
    counter.count++;
  }
};
```

This patterns is very useful as the complexity of your state increases. Think about everything before the `return` as the `constructor` of a class, and everything after as the `methods` of a class. But unlike a class there is no `this` reference, you just point directly to variables and functions you want to use.

## Nesting and composing state

You will be building a state tree for all the state in your application and that requires nesting state and composing state. Since this state tree is just a JavaScript object you use the language feature to nest and compose.

```ts
import { reactive } from "bonsify";

export const app = reactive({
  title: "My Awesome App",
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

Any time you define state with a reference (a variable), you should use `reactive`. This ensures that regardless of using `this` or the reference, you will be accessing the reactive reference.

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

Using `getters` you can derive state. You can argue that primitives like `computed` will also cache the derived state, but how often is the cache actually used? When changing state you are typically looking at the derived UI of it. That means whatever `computed` you are using is always re-evaluating anyways.

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

You explicitly set the new value when needed. And then you might say; "but this might go stale?". That is true, but is that a practical concern or a theoretical one? Also, `computed` recalculates as components consume the state, meaning the expensive computation happens during the rendering phase. You would rather want to have the freedom to run this expensive calculation when it makes sense.

## Always pass parent state

When nesting state you want to pass and attach the parent state. This can be achieved by using a `getter`:

```ts
import { reactive } from "bonsify";

const createNested = (app) =>
  reactive({
    app,
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
    },
  });

  const nested = createNested(app);

  return app;
};
```

The reason you wanta to do this is so that any piece of state can traverse up the state tree. This will be especially important when accessing state in components.

## Persisting state

The great thing about state is that it is really JSON. The functions in the state tree will disappear if you serialize the state. So `JSON.stringify` can be performed in any part of the tree and you can also easily bring back persisted state by spreading it into your state. Here using a pseudo utility for persisting JSON:

```ts
import { reactive } from "bonsify";

export const createApp = (utils) => {
  const persistedState = utils.persistence.getJSON("app");

  const app = reactive({
    count: 0,
    ...persistedState,
    increase() {
      this.count++;
    },
    persist() {
      utils.persistence.setJSON("app", app);
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
const createItem = (data) =>
  reactive({
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

```ts
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
