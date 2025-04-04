# Pattern: Constructor

```ts
import { reactive } from "mobx-reactive";

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

Even though Mobx was originally popularized with classes, there is an overhead moving between object oriented class based code and functional components. You can use functions to encapsulate state and logic as well. And you can do so removing the boilerplate of keywords and `this` binding.
