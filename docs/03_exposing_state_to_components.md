# Exposing state to components

**Bonsify** makes observation transparent. With the included babel/swc plugin any component function defined in your codebase will become observers. That means you do not have to think about adding observation or worry about props passing etc. The observation memory footprint is tiny and saves you from a lot of reconciliation work as components will only reconcile by the state they observe. Additionally these observing components uses `memo` as your props passing will mostly be with state references, which are non changing references.

## Creating a contract between state and components

With state management solutions you often consume root state through a context provider and use selectors to narrow down to the specific state you want to consume. Problems arises if you use TypeScript and your state is at some level dynamic. A value can be there or it might not be there.

For example a component might want access to a user, but the user might be `null`. If the user is passed as a prop, it is guaranteed it will be there. But if it is consumed by a selector hook, you can not give that same guarantee.

That is why you should not consume state directly or using a context provider. Pass it down as a prop.

```tsx
import { createState } from "./state";

const state = createState();

render(<App state={state} />);
```

As your components narrows down on specific state, also pass the related narrowed state down as a prop.

This reduces props passing and maximize discoverability by finding any state pointing to this state object.

## Traversing up

If a component has been passed a nested state as a prop, it is useful for that component to still be able to access parent state. This can be solved when you construct your state interface.

```ts
import { reactive } from "bonsify";

function createCounter(root) {
  const counter = reactive({
    root,
    count: 0,
    increase() {
      counter.count++;
    },
  });

  return counter;
}

export function createRoot() {
  const root = reactive({
    isAwesome: true,
    get counter() {
      return counter;
    },
  });

  const counter = createCounter(root);

  return root;
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
