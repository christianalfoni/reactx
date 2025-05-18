# Get Started

::: code-group

```sh [npm]
npm install reactx
```

```sh [yarn]
yarn add reactx
```

```sh [pnpm]
pnpm add reactx
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
