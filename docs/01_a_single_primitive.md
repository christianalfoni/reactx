# A single primitive

Enabling components to observe the state you expose to them is really the only thing a state management library needs to do. By providing one single primitive of `reactive`, and a plugin that makes your components observers, **Bonsify** makes state management for React as transparent and simple as technically possible.

To build your state management you will rather rely on the JavaScript language. To start you can simply do:

```tsx
import { counter } from "bonsify";

const counter = reactive({
  count: 0,
  increase() {
    counter.count++;
  },
});

function Counter() {
  return <button onClick={counter.increase}>Count ({counter.count})</button>;
}
```

But read on to learn more about how to use the language to write readable, maintainable and testable state management.
