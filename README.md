# Mobx Lite

> Mobx reimagined

## Get Started

```sh
npm install mobx-lite
```

Automatic observation in components using [observing-components](https://github.com/christianalfoni/observing-components).

```ts
import babelPlugin from "mobx-lite/babel-plugin";
import swcPlugin from "mobx-lite/swc-plugin";
```

```tsx
import { reactive } from "mobx-lite";

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
