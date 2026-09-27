import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
    dedupe: ["@icp-sdk/core"],
  },
  test: {
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // The build container reports a single CPU, so Vitest's default
    // `maxWorkers` (cpus - 1 = 0) conflicts with its default `minWorkers` (1)
    // and Tinypool throws before any test runs. Pin both to 1.
    minWorkers: 1,
    maxWorkers: 1,
  },
});
