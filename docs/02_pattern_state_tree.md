# Pattern: State Tree

Building a state tree allows your components to consume all the state of your application from a root object. The mental model of a single state tree is the exact same model as your components. This creates less friction moving between the two concepts and with the **constructor pattern** the code will also look very similar.

Building up a state tree is about composition, just like components:

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

export function State() {
  return {
    counter: Counter(),
  };
}
```

## Passing parent state

When nesting objects it can be useful to pass the parent state. As this is a circular dependency you will need to use a `getter`:

```ts
import { reactive } from "bonsify";

function Doubler(counter) {
  return {
    get double() {
      return counter.count * 2;
    },
  };
}

export function Counter() {
  const counter = reactive({
    count: 0,
    get doubler() {
      return doubler;
    },
    increase,
  });

  const doubler = Doubler(counter);

  return counter;

  function increase() {
    counter.count++;
  }
}
```

## Disposing state

You might initialize nested state that creates a side effect. If the parent state is disposed for whatever reason you want to clean up these nested effects.

```ts
// The counter creates an interval effect
function Counter({ onDispose }) {
  const counter = reactive({
    count: 0,
  });

  const interval = setInterval(increaseCount, 1000);

  onDispose(() => clearInterval(interval));

  return counter;

  function increaseCount() {
    counter.count++;
  }
}

// We allow this state to be disposed
export function State() {
  // We keep track of any disposers
  const disposers = new Set();
  const state = reactive({
    // We pass it down the tree
    counter: Counter({ onDispose }),
    // When disposing of the state, any registered disposers are also disposed
    dispose() {
      disposers.forEach((dispose) => dispose());
      disposers.clear();
    },
  });

  return state;

  function onDispose(disposer) {
    disposers.set(disposer);
  }
}
```
