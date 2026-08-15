import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for PAKKA e2e. Tests live in apps/web/e2e. At scaffold time (Prompt 01) there is one smoke
 * test that the app boots; real flows arrive in Prompt 14. The dev server is started for the run; a local
 * apps/web/.env.local supplies NEXT_PUBLIC_* values (see .env.example).
 */
export default defineConfig({
  testDir: "./apps/web/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -w @pakka/web",
    url: "http://localhost:3000",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
