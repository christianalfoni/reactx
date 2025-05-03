# Hello World

```tsx
import { reactive } from "mobx-lite";

class CounterState {
  count = 0;
  increase() {
    this.count++;
  }
}

const counter = reactive(new CounterState());

function Counter() {
  return (
    <div>
      <span>{counter.count}</span>
      <button onClick={counter.increase}>Increase</button>
    </div>
  );
}
```
