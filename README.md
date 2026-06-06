# ReactX

> Transparent reactive state management for React

```sh
npm install reactx@alpha
```

## Documentation

- [Architecture](docs/architecture.md) — the services → state → components → ui-components layering
- [Patterns](docs/patterns.md) — composing state, services, invariants, subscriptions

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

## Using with AI coding agents

Copy this into your `CLAUDE.md` (or equivalent agent instructions file):

```markdown
## Services, State and UI

**Setup**: `reactive(new AppState(services))` makes the instance observable. The Vite plugin auto-wraps all exported React components as observers. Wire to React with `createContext` + a `useXxx` hook that throws on missing provider.

**`*State` classes** own observable state (properties), computed values (getters), and mutations (methods). No special APIs — plain OO.

**`*Service` classes** own side effects (HTTP, storage, timers). Inject via constructor; define an interface so tests can swap in lightweight implementations without mocking.

**Components** read from context and call methods directly. No special hooks needed for reading state.

**Invariants**: When a value is nullable at the top but guaranteed present in a subtree, expose a getter that throws. Components in that subtree use it without null checks — a violation is a programming error, not a runtime condition.
```

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
