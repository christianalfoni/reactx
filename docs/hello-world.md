# Hello World

_CounterState.ts_

```ts
import { reactive } from "mobx-reactive";

export type CounterState = ReturnType<typeof CounterState>;

function CounterState() {
  const counter = reactive({
    count: 0,
    increase,
  });

  return reactive.readonly(counter);

  function increase() {
    counter.count++;
  }
}
```

_Counter.tsx_

```tsx
const counter = CounterState();

function Counter() {
  return (
    <div>
      <span>{counter.count}</span>
      <button onClick={counter.increase}>Increase</button>
    </div>
  );
}
```
