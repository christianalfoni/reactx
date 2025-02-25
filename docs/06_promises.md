# Promises

You can choose to put promises into your state. This is especially valuable with React as you can suspend those promises in components.

The mental model for promises is often that they act as a temporary primitive that transfers a value from an asynchronous source to a variable. Like:

```ts
// The promise is only there for as long as the data fetching runs
const data = await fetchData();
```

But promises does not disappear when it is resolved, the promise IS the value. So you can also say:

```ts
const asyncDataPromise = fetchData();
const data = await asyncDataPromise;
const dataAgain = await asyncDataPromise;
```

You can hold on to the promise and retrieve the value whenever you want. So for example we can have a promise of a counter and make it reactive:

```tsx
export function createState() {
  const state = reactive({
    counter: fetchCounter().then(reactive),
    async increase() {
      // Just await the value to unwrap it
      const counter = await state.counter;
      counter.count++;
    },
  });

  return state;
}

// In a component
function Counter() {
  // Use Reacts use hook to unwrap it, using suspense
  const counter = use(state.counter);

  return <div>{counter.count}</div>;
}
```
