import { Buffer } from "node:buffer";

import { expect, test } from "@playwright/test";

test("imports, edits, autosaves, and keeps editor actions visible", async ({
  page,
}) => {
  await page.goto("/");

  await page.locator('input[type="file"]').setInputFiles({
    name: "meeting-notes.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("# Meeting Notes\n\nInitial import"),
  });

  await expect(page).toHaveURL(/\/editor\//);
  await expect(page.locator('input[value="meeting-notes"]')).toBeVisible();

  await page.locator(".cm-content").click();
  await page.keyboard.press("End");
  await page.keyboard.type("\n## Next Steps\n- [x] Ship MVP");

  await expect(page.getByRole("heading", { name: "Next Steps" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /next steps/i })).toBeVisible();
  await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 3000 });

  await page.reload();

  await expect(page.getByRole("heading", { name: "Next Steps" })).toBeVisible();
  await expect(page.getByRole("button", { name: /导出 markdown/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /导出 html/i })).toBeVisible();
});
