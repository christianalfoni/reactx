# Consuming state

**Bonsify** makes observation transparent. With the included babel/swc plugin any component function defined in your codebase will become observers. That means you do not have to think about adding observation or worry about props passing etc. The observation memory footprint is tiny and saves you from a lot of reconciliation work as components will only reconcile by the state they observe. Additionally these observing components uses `memo` as your props passing will mostly be with "non changing references".

## Creating a contract between state and components

With state management solutions you often consume root state through a context provider and use selectors to narrow down to the specific state you want to consume. Problems arises if you state is at some level dynamic. Either it is there, or it is not there.

For example a component might want access to a user, but the user might be `null`. If the user is passed as a prop, it is guaranteed it will be there. But if it is consumed by a selector hook, you can not give that same guarantee.

That is why you should not consume state directly or using a context provider. Pass it down as props.

```tsx
import { createState } from "./state";

const state = createState();

render(<App state={state} />);
```

As your components narrows down on specific state, also pass the related narrowed state down as props. Your components can always reference back up the state tree no matter how deep they are. Passing these state branches as props has no effect on performance as they do not change reference unless the whole branch is replaced/removed.
