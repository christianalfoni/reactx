import type { Plugin } from "vite";
import { transformAsync } from "@babel/core";
import createPlugin from "babel-plugin-observing-components";

const VIRTUAL_ID = "virtual:reactx-devtools";
const RESOLVED_VIRTUAL_ID = "\0" + VIRTUAL_ID;

export interface ReactxPluginOptions {
  /** Glob patterns to exclude from the observer transform (e.g. ["**\/stories\/**"]) */
  exclude?: string[];
}

export function reactx(options: ReactxPluginOptions = {}): Plugin[] {
  return [
    // ── observer transform ────────────────────────────────────────────────
    {
      name: "vite-plugin-reactx-observer",
      enforce: "pre",
      async transform(code, id) {
        if (!/\.[jt]sx?$/.test(id)) return null;
        if (id.includes("node_modules")) return null;

        const result = await transformAsync(code, {
          filename: id,
          plugins: [createPlugin({ importPath: "reactx", ...options })],
          sourceMaps: true,
          configFile: false,
          babelrc: false,
          parserOpts: { plugins: ["jsx", "typescript"] },
        });

        if (!result || result.code == null) return null;
        return { code: result.code, map: result.map ?? null };
      },
    },

    // ── devtools overlay (dev only) ───────────────────────────────────────
    {
      name: "vite-plugin-reactx-devtools",
      apply: "serve",

      resolveId(id) {
        if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
      },

      load(id) {
        if (id === RESOLVED_VIRTUAL_ID) return `import "reactx/devtools";`;
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
    },
  ];
}
