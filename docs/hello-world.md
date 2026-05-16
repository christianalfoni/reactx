# Hello World

```tsx
import { reactive } from "reactx";

class Counter {
  count = 0;

  increment() {
    this.count++;
  }
}

export const counter = reactive(new Counter());

function Counter() {
  return (
    <div>
      <span>{counter.count}</span>
      <button onClick={counter.increment}>Increment</button>
    </div>
  );
}
```

`reactive()` is called once at module level. It:

- Makes properties reactive when they are first accessed by a component
- Binds all methods to the class instance
- Enables devtools observation when an observer is provided
