# A single primitive

```ts
import { reactive } from "bonsify";

export const app = reactive({
  count: 0,
  increase() {
    this.count++;
  },
});
```

That's it for this page.
