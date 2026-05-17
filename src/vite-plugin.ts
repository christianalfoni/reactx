import type { Plugin } from "vite";

const VIRTUAL_ID = "virtual:reactx-devtools";
const RESOLVED_VIRTUAL_ID = "\0" + VIRTUAL_ID;

/**
 * Vite plugin that automatically injects the ReactX DevTools overlay in
 * development mode. The overlay is mounted into a Shadow DOM root so it
 * never interferes with the host application's styles.
 *
 * Add this to your `vite.config.ts` **before** the React plugin:
 *
 * ```ts
 * import { reactxDevtools } from "reactx/vite-plugin";
 *
 * export default defineConfig({
 *   plugins: [reactxDevtools(), react()],
 * });
 * ```
 */
export function reactxDevtools(): Plugin {
  return {
    name: "vite-plugin-reactx-devtools",

    // Dev server only — no-op during production builds.
    apply: "serve",

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_ID) {
        return `import "reactx/devtools";`;
      }
    },

    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: { type: "module", src: `/@id/${VIRTUAL_ID}` },
          injectTo: "head-prepend",
        },
      ];
    },
  };
}
