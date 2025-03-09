# Pattern: Constructor

The constructor pattern is focused on writing code for components and state management by following the same principle. This principle is exposing first WHAT the implementation is and then HOW the implementation works.

It is important to highlight that implementing new concepts often requires several iterations on "what it is" and "how it does it", where you should not feel constrained by a pattern. But when you are happy with your implementation this pattern will help the next developer better understand what you implemented.

**Component**

```tsx
import { useState } from "react";

// The name in PascalCase and dependencies as an object
export function Counter({ initialCount }) {
  // Constructor
  const [count, setCount] = useState(initialCount || 0);

  // Return public interface
  return <button onClick={increase}>Count is: {count}</button>;

  // Methods
  function increase() {
    setCount((current) => current + 1);
  }
}
```

**State Management**

```ts
import { reactive } from "bonsify";

// The name in PascalCase and dependencies as an object
export function Counter({ initialCount }) {
  // Constructor
  const counter = reactive({
    count: initialCount || 0,
    increase,
  });

  // Return public interface
  return counter;

  // Methods
  function increase() {
    counter.count++;
  }
}
```

This pattern is very useful as the complexity increases. Think about everything before the `return` as the `constructor` of a class, and everything after as the `methods` of a class. But unlike a class there is no special keywords or `this` reference, you just point directly to any dependencies, variables or functions you want to use.
