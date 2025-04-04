# Get Started

::: code-group

```sh [npm]
npm install mobx-reactive
```

```sh [yarn]
yarn add mobx-reactive
```

```sh [pnpm]
pnpm add mobx-reactive
```

:::

Configure observation plugin:

::: code-group

```ts [vite.config.ts (babel)]
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mobxReactive from "mobx-reactive/babel-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [mobxReactive()],
      },
    }),
  ],
});
```

```ts [vite.config.ts (swc)]
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import mobxReactive from "mobx-reactive/swc-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      plugins: [mobxReactive()],
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
      plugins: [mobxReactive({ exclude: ["src/ui-components"] })],
    }),
  ],
});
```

:::
