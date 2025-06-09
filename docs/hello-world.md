# Hello World

```tsx
import { reactive } from "reactx";

class CounterState {
  count = 0;
  increase() {
    this.count++;
  }
}

// Expose state to React with `reactive`
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

`reactive` is only called once, where you provide your root state to React, however you choose to expose it. It will:

- Lazily enhance your state management to be reactive, where needed
- Prevent direct state mutation from React
- Bind methods accessed to the class instance
- Enable the visualization of your app and interactions in the devtools
