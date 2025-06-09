import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import plugin from "reactx/babel-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [plugin()],
      },
    }),
  ],
});
