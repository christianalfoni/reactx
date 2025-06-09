# reactive

```ts
import { reactive } from "reactx";

class State {
  count = 0;
  get computedDouble() {
    return this.count * 2;
  }
  increase() {
    this.count++;
  }
}

const reactiveState = reactive(new State());
```

Makes your state a reactive proxy where access to properties lazily makes the state reactive, methods are bound to the class instance and any mutations are protected.
