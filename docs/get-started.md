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

Configure observation plugin:

::: code-group

```ts [vite.config.ts (babel)]
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import reactx from "reactx/babel-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [reactx()],
      },
    }),
  ],
});
```

```ts [vite.config.ts (swc)]
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import reactx from "reactx/swc-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      plugins: [reactx()],
    }),
  ],
});
```

:::

::: info
You can exclude certain paths from being transformed by the plugin using the `exclude` option:

```ts
export default defineConfig({
  plugins: [
    react({
      plugins: [reactx({ exclude: ["src/ui-components"] })],
    }),
  ],
});
```

:::

## Devtools

Run the ReactX devtools with `npx reactx`. This will start an Electron app that you can connect to.

When you create the reactive bridge to React, you can configure development mode by:

```ts
// This connects to the default port of the Devtools
const state = reactive(new State(), true);

// Define a custom host and port for the Devtools
const state = reactive(new State(), "localhost:4041");
```
