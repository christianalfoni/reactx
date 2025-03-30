import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const ReactCompilerConfig = {
  target: "19", // '17' | '18' | '19'
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProfiling = mode === "profiling";

  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        ...(isProfiling
          ? {
              // Force both imports to use the profiling build.
              "react-dom/client": "react-dom/profiling",
            }
          : {}),
      },
    },
    plugins: [
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
          // plugins: [observerPlugin()],
        },
      }),
      tailwindcss(),
    ],
  };
});
