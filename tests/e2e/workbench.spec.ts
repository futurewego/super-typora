import { expect, test } from "@playwright/test";

test("creates a new document from the workbench and shows it in recents", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /super markdown/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /新建文档/i }).click();

  await expect(page).toHaveURL(/\/editor\//);
  await expect(page.locator('input[value="Untitled"]')).toBeVisible();

  await page.goto("/");

  await expect(page.getByText("Untitled")).toBeVisible();
});
