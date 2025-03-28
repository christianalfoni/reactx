# Pattern: Constructor

It is important to highlight that implementing new concepts often requires several iterations on "what it is" and "how it does it", where you should not feel constrained by a pattern. But when you are happy with your implementation this pattern will help the next developer better understand what you implemented.

```ts
import { reactive } from "bonsify";

// The name in PascalCase and params as an object
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

This pattern is very useful as the complexity increases. Think about everything before the `return` as the `constructor` of a class, and everything after as the `methods` of a class. But unlike a class you separate public and private by returning the public interface. There is no special keywords or `this` reference, you just point directly to any dependencies, variables or functions you want to use. That means you can safely reference the functions at any point in your code without worrying about the `this` binding.
