# Get Started

::: code-group

```sh [npm]
npm install reactx@alpha
```

```sh [yarn]
yarn add reactx@alpha
```

```sh [pnpm]
pnpm add reactx@alpha
```

:::

## Setup

ReactX includes a Vite plugin that automatically wraps your components as reactive observers and injects the DevTools overlay in development. Add it to your Vite config **before** the React plugin:

```ts [vite.config.ts]
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // or @vitejs/plugin-react
import { reactx } from "reactx/vite-plugin";

export default defineConfig({
  plugins: [
    reactx(),
    react(),
  ],
});
```

The plugin does two things:

- **Observer transform** — every exported React component is automatically wrapped with `observer`, so components re-render whenever the reactive state they read changes. No manual wrapping needed.
- **DevTools overlay** — in development, a panel is injected into the page showing live state, computed values, and a full action history with mutations and service calls.

::: info Excluding paths
You can exclude certain files from the observer transform using the `exclude` option:

```ts
reactx({ exclude: ["src/ui-library/**"] })
```
:::
