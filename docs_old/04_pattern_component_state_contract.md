# Pattern: Component State Contract

```tsx
import { State } from "./state";

const state = State();

render(<App state={state} />);
```

Typically global state stores are exposed through a context provider. Problems arises if you use TypeScript and your state is at some level dynamic. A value can be there or it might not be there. For example a component might want access to a user, but the user might be `null`. If the user is passed as a prop, it is guaranteed it will be there. As your components only needs branches of your state, pass the branches down as props.

## Traversing up

If a component has been passed a branch of state as a prop, it is useful for that component to still be able to access parent state. This can be solved when you construct your state interface.

```ts
import { reactive } from "bonsify";

function Counter({ root }) {
  const counter = reactive({
    root,
    count: 0,
    increase,
  });

  return counter;

  function incerase() {
    counter.count++;
  }
}

export function Root() {
  const root = reactive({
    isAwesome: true,
    get counter() {
      return counter;
    },
  });

  const counter = Counter({ root });

  return reactive.readonly(root);
}
```

Notice how we passed the `root` reference down to `counter` and also attached it on the `counter` object. Now a component consuming only the `counter` can still traverse back up.

```tsx
function Counter({ counter }) {
  return (
    <button onClick={counter.increase}>
      Count is {counter.count} {counter.root.isAwesome ? "Awesome" : null}
    </button>
  );
}
```
