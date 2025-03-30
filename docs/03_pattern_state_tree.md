# Pattern: State Tree

Building a state tree allows your components to consume all the state of your application from a root object. The mental model of a single state tree is the exact same model as your components.

Building up a state tree is about composition, just like components:

```ts
import { reactive } from "mobx-reactive";

function Counter() {
  const counter = reactive({
    count: 0,
    increase,
  });

  return reactive.readonly(counter);

  function increase() {
    counter.count++;
  }
}

export function State() {
  const state = reactive({
    counter: Counter(),
  });

  return reactive.readonly(state);
}
```
