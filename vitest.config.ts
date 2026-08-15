import { defineConfig } from "vitest/config";

export default defineConfig({
  // Pin an empty PostCSS config so Vite does not walk parent directories looking for one. Package unit tests
  // are pure Node with no CSS pipeline; without this, Vite can pick up an unrelated postcss config outside the repo.
  css: { postcss: { plugins: [] } },
  test: {
    include: ["packages/**/*.test.ts"],
    exclude: ["**/node_modules/**", "apps/**"],
    environment: "node",
  },
});
