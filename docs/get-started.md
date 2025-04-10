# Get Started

::: code-group

```sh [npm]
npm install mobx-lite
```

```sh [yarn]
yarn add mobx-lite
```

```sh [pnpm]
pnpm add mobx-lite
```

:::

Configure observation plugin:

::: code-group

```ts [vite.config.ts (babel)]
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mobxLite from "mobx-lite/babel-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [mobxLite()],
      },
    }),
  ],
});
```

```ts [vite.config.ts (swc)]
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import mobxLite from "mobx-lite/swc-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      plugins: [mobxLite()],
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
      plugins: [mobxLite({ exclude: ["src/ui-components"] })],
    }),
  ],
});
```

:::
