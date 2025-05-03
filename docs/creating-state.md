# Creating state

```tsx
class CounterState {
  count = 0;
  increase() {
    this.count++;
  }
}
```

With Mobx Lite you do not need to define your state as reactive. This is also true for nested classes. Just create classes as you normally do. Only when you expose the root state to React you need to make it reactive.

```tsx
import { reactive } from "mobx-lite";

const reactiveCounter = reactive(new CounterState());

render(<App state={reactiveCounter} />);
```

`reactive` does not only make your state reactive, it:

- Lazily makes classes reactive when accessed by React
- Prevents any mutations happening from React
- All class methods called from React are bound to the class instance

```tsx
function Counter() {
  return (
    <div>
      <span>{counter.count}</span>
      <button onClick={() => counter.increase()}>Increase</button>
    </div>
  );
}
```
