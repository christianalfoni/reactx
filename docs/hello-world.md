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

`reactive` is only called once, when providing your root state to React, however you choose to expose it. React will then enhance your state management to be become reactive where it needs it to be, without being able to mutate state directly.
