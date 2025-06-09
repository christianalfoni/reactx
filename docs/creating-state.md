# Creating state

```tsx
class CounterState {
  count = 0;
  increase() {
    this.count++;
  }
}
```

With **ReactX** you do not need to define your state as reactive. This is also true for nested classes. Just create classes as you normally do. Only when you expose the root state to React you need to make it reactive.

```tsx
import { reactive } from "reactx";

const reactiveCounter = reactive(new CounterState());

render(<Counter counter={reactiveCounter} />);
```

This is what `reactive` does:

- Lazily makes properties reactive when accessed by React
- Prevents any direct mutations happening from React
- All class methods called from React are bound to the class instance
- Sends information to the devtools

```tsx
function Counter({ counter }) {
  return (
    <div>
      <span>{counter.count}</span>
      <button onClick={counter.increase}>Increase</button>
    </div>
  );
}
```

::: info

Since React can only "reactify" properties that is publicly available you can use `private` keyword in your classes to hide properties from React and prevent them from becoming reactive.

:::
