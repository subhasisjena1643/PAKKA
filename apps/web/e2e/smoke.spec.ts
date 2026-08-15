import { expect, test } from "@playwright/test";

/**
 * Scaffold smoke (Prompt 01): the app boots and renders. Real attendee/merchant/wall flows are added in
 * Prompt 14 (G14). This asserts nothing about PAKKA product behaviour yet.
 */
test("app boots and renders a document body", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("body")).toBeVisible();
});
