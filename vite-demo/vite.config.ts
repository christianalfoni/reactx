import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { observingComponents } from "vite-plugin-observing-components";
import { reactxDevtools } from "reactx/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    observingComponents({ importPath: "reactx" }),
    reactxDevtools(),
    react({ tsDecorators: true }),
  ],
  resolve: {
    // Ensure react/react-dom resolve from this package, not from the
    // symlinked reactx parent's node_modules.
    dedupe: ["react", "react-dom"],
  },
});
