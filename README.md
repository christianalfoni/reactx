# ReactX

> Transparent reactive state management

## Get Started

```sh
npm install reactx@alpha
```

Automatic observation in components using [observing-components](https://github.com/christianalfoni/observing-components).

```ts
import babelPlugin from "reactx/babel-plugin";
import swcPlugin from "reactx/swc-plugin";
```

```tsx
import { reactive } from "reactx";

const state = reactive({
  count: 0,
  increase() {
    state.count++;
  },
});

function Counter() {
  return (
    <div>
      <div>{state.count}</div>
      <button onClick={() => state.increase()}>Increase</button>
    </div>
  );
}
```
