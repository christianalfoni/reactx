import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { reactx } from "reactx/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    reactx(),
    react({ tsDecorators: true }),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
