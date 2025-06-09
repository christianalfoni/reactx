#!/usr/bin/env node

// This script acts as a proxy to execute overmind-devtools
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createRequire } from "module";

// Create a require function to locate the overmind-devtools package
const require = createRequire(import.meta.url);

// Find path to overmind-devtools executable
const overmindPath = resolve(
  dirname(require.resolve("overmind-devtools/package.json")),
  "bin.js"
);

// Execute overmind-devtools with the same arguments passed to this script
const result = spawnSync("node", [overmindPath, ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
});

// Forward the exit code
process.exit(result.status || 0);
