# Pattern: Protected State

```ts
import { reactive } from "mobx-reactive";

function Counter() {
  const counter = reactive({
    count: 0,
    increase,
  });

  return reactive.readonly(counter);

  function increase() {
    counter.count++;
  }
}
```

Mobx introduced the `action` to prevent mutations from React. This has caused headaches over the years as `async/await` was introduced to the language, resulting in yet another abstraction of `flow`. With Mobx Reactive you rather expose your state reference as `readonly`. Now the consumer of your state can not make any changes, but everything inside your state scope can.
