# Mental overhead

State management tools typically offer several primitives and abstractions. They are all well intended to offer you the best possible developer experience. What is often ignored though is the cost of introducing primitives and/or abstractions over state in the first place.

All the primitives and abstractions below I consider overhead. They are not needed to manage state in applications and they all diverge us from this simple fact that your application can be described as a tree of state and related functions, just like your UI is a tree of elements and behaviors. And I am not covering the following cases even:

- Dynamically initialise state with related functions
- Parent state dependencies
- Disposing state
- Testing

## Immutability

React leans on immutability for its change detection. React went on somewhat of a crusade of "mutability is the root of all evil". Yes, mutability can cause a unique type of bug compared to immutability, but stating that mutability is inherently bad and immutability is inherently good is absolute bullshit. Immutability has a huge cost in JavaScript. Not just performance and memory footprint, but the language has no built in primitives for immutability. That means you have to break down the intuition of expressing changes in the language and learn new primitives, or at least new verbose patterns of expressing change.

## State abstractions

All state management tools comes with abstractions over state and changing state. Some more verbose than others, but all expose primitives and/or abstractions that diverges from the simplest idea of state management. You can argue this is to handle complexity or provide guarantees, but I want to argue you do not need this to handle complexity and the guarantees only solves theoretical problems.

The most straight forward way to describe a counter is to:

```ts
const counter = {
  count: 0,
  increase() {
    this.count++;
  },
};
```

But no state management tool allows you to express this:

**Redux**

```ts
import { createSlice } from "@reduxjs/toolkit";

const counterSlice = createSlice({
  name: "counter",
  initialState: {
    value: 0,
  },
  reducers: {
    increment: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { increment, decrement, incrementByAmount } = counterSlice.actions;

const store = configureStore({
  reducers: {
    counter: counterSlice.reducer,
  },
});
```

**Cerebral**

```ts
const counter = App({
  state: {
    count: 0,
  },
  sequences: {
    increase: [increment(state`count`)],
  },
});
```

**Overmind**

```ts
const counter = createOvermind({
  state: {
    count: 0,
  },
  actions: {
    increase({ state }) {
      state.count++;
    },
  },
});
```

**Mobx**

```ts
class Counter {
  count = 0;
  constructor() {
    makeObservable(this, {
      count: observable,
      increase: action,
    });
  }
  increase() {
    this.count++;
  }
}
```

**Mobx-State-Tree**

```ts
const Counter = t
  .model("Counter", {
    count: t.number,
  })
  .actions((counter) => ({
    increase() {
      counter.count++;
    },
  }));
```

**Jotai**

```ts
const createCounterAtoms = () => {
  const counterAtom = atom(0);
  const valueAtom = atom((get) => get(counterAtom));
  const incrementAtom = atom(null, (get, set) =>
    set(counterAtom, (c) => c + 1)
  );
  return [valueAtom, incrementAtom];
};

const [count, increment] = createCounterAtoms(0);
```

**Zustand**

```ts
const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

## Composition

Another very important aspect of defining the state of your application is how you can compose it together from multiple parts. At its core, composition should be as easy as:

```ts
const state = {
  namespaceA,
  namespaceB,
};
```

But also here the specific tools brings their own flavours of this fundamental concept:

**Redux**

```ts
const store = createStore(
  combineReducers({
    namespaceA,
    namespaceB,
  })
);
```

**Cerebral**

```ts
const app = App({
  state: {
    namespaceA: namespaceA.state,
    namespaceB: namespaceB.state,
  },
  sequences: {
    namespaceA: namespaceA.sequences,
    namespaceB: namespaceB.sequences,
  },
});
```

**Overmind**

```ts
const app = createOvermind(
  namespaced({
    namespaceA,
    namespaceB,
  })
);
```

**Mobx**

```ts
class App {
  namespaceA = new NamespaceA();
  namespaceB = new NamespaceB();
}
```

**Mobx-State-Tree**

```ts
const App = t.model("App", {
  namespaceA: NamespaceA,
  namespaceB: NamespaceB,
});
```

**Jotai**

```ts
const appAtom = atom({
  namespaceA: namespaceAAtom,
  namespaceB: namespaceBAtom,
});
```

**Zustand**

_Not supported_

```ts
const useNamespaceA = create();
const useNamespaceB = create();
```

## Observers

Immutable or not, you need to provide state to components and subscribe to updates. This also brings with it abstractions and primitives unique to each state management tool that you should not need to care about. State management should be performant and observable out of the box without any additional code or mental overhead:

```tsx
function Counter() {
  return (
    <button onClick={() => state.increase()}>Increase ({state.count})</button>
  );
}
```

But the different tools exposes this complexity and often puts it in your hands to evaluate the performance cost:

**Redux**

```tsx
const useCount = useSelector((state) => state.count);

function Counter() {
  const count = useCount();
  const dispatch = useDispatcher();

  return (
    <button onClick={() => dispatch({ type: "INCREASE" })}>
      Increase ({count})
    </button>
  );
}
```

**Cerebral**

```tsx
export const Counter = connect(
  {
    count: state`count`,
    increase: sequence`increase`,
  },
  ({ count, increase }) => {
    const count = useCount();
    const dispatch = useDispatcher();

    return <button onClick={() => increase()}>Increase ({count})</button>;
  }
);
```

**Overmind**

```tsx
function Counter() {
  const state = useAppState();
  const actions = useAppActions();

  return (
    <button onClick={() => actions.increase()}>Increase ({state.count})</button>
  );
}
```

**Mobx / Mobx-State-Tree**

```tsx
const Counter = observer(() => {
  return <button onClick={() => app.increase()}>Increase ({app.count})</button>;
});
```

**Jotai**

```tsx
function Counter() {
  const [count, increase] = useAtom(counterAtom);

  return <button onClick={() => increase()}>Increase ({count})</button>;
}
```

**Zustand**

```tsx
function Counter() {
  const counter = useCounterStore((state) => state);

  return (
    <button onClick={() => counter.increase()}>
      Increase ({counter.count})
    </button>
  );
}
```

## Computed/Derived/Memo

The promise of the primitive computed/derived/memo is to cache the generated value until its dependencies change. But we derive state all the time without caching. For example in a component most of the displayed state is derivede. My point is that most derivations of state in an application does not need caching and when you do have expensive computation you can rather manually set the value. You might argue this can go stale and yes it can, but that concern has a much smaller real cost than having to learn and reason about another primitive.

## Reaction/Effect

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

Reactions and effects are fundamentally bad constructs. They do not improve your understanding of how your code executes and are not necessary. Even in scenarios where the `count` could change from multiple places and you want to centralise the log statement the indirection is not worth it.
