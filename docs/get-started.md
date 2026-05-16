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

ReactX requires a compiler plugin to automatically wrap your components as reactive observers. Install the Vite plugin:

```sh
npm install -D vite-plugin-observing-components
```

Then add it to your Vite config **before** the React plugin:

```ts [vite.config.ts]
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // or @vitejs/plugin-react
import { observingComponents } from "vite-plugin-observing-components";

export default defineConfig({
  plugins: [
    observingComponents({ importPath: "reactx" }),
    react(),
  ],
});
```

The plugin automatically wraps every exported React component with `observer`, so components re-render whenever the reactive state they read changes. No manual wrapping needed.

::: info Excluding paths
You can exclude certain paths from transformation using the `exclude` option:

```ts
observingComponents({
  importPath: "reactx",
  exclude: ["src/ui-library/**"],
})
```
:::

## Devtools

Run the ReactX devtools with:

```sh
npx reactx
```

This starts an Electron app you can connect to. Pass an observer when creating your reactive state:

```ts
import { reactive, ConsoleObserver } from "reactx";

export const app = reactive(new App(), {
  observer: new ConsoleObserver(),
});
```
