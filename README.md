# ReactX

> Transparent reactive state management for React

```sh
npm install reactx@alpha
```

## Documentation

- [Creating State](docs/creating-state.md) — classes, computed values, nested and per-key state
- [Components](docs/components.md) — reading state, scoping re-renders, async patterns
- [Services](docs/services.md) — infrastructure, platform abstraction, testing

## Quick example

```ts
// app.ts
import { reactive } from "reactx";

class AppState {
  count = 0;

  increment() {
    this.count++;
  }

  get doubled() {
    return this.count * 2;
  }
}

export const app = reactive(new AppState());
```

```tsx
// App.tsx
function App() {
  return (
    <button onClick={app.increment}>
      {app.count} (doubled: {app.doubled})
    </button>
  );
}
```

`reactive()` makes the class instance lazily observable. Components re-render only when the properties they actually read change — no providers, no hooks, no boilerplate. Build your application state and logic with an objected oriented mindset and derive a functional UI from it.

## Setup

Add the Vite plugin to your config **before** the React plugin:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { reactx } from "reactx/vite-plugin";

export default defineConfig({
  plugins: [reactx(), react()],
});
```

This automatically wraps every exported React component with `observer` and injects the DevTools overlay in development. To exclude certain files from the observer transform:

```ts
reactx({ exclude: ["src/ui-library/**"] });
```
