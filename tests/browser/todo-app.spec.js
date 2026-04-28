const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
});

test("can add, complete, and filter tasks", async ({ page }) => {
  const input = page.getByPlaceholder("Add a new task");

  await input.fill("Write browser QA tests");
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page.getByText("Write browser QA tests")).toBeVisible();

  await page.locator(".task-item .toggle-btn").first().click();
  await expect(page.locator(".task-item.completed")).toHaveCount(1);

  await page.getByRole("button", { name: "Active" }).click();
  await expect(page.getByText("No active tasks. You're all caught up.")).toBeVisible();

  await page.getByRole("button", { name: "Completed" }).click();
  await expect(page.getByText("Write browser QA tests")).toBeVisible();
});

test("settings persist and affect delete confirmation flow", async ({ page }) => {
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Confirm before delete").uncheck();
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved.")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByLabel("Confirm before delete")).not.toBeChecked();

  const dialogTriggered = { value: false };
  page.on("dialog", async (dialog) => {
    dialogTriggered.value = true;
    await dialog.dismiss();
  });

  const input = page.getByPlaceholder("Add a new task");
  await input.fill("Task to delete");
  await page.getByRole("button", { name: "Add" }).click();
  await page.locator(".task-item .delete").first().click();

  await expect(page.getByText("Task to delete")).toHaveCount(0);
  expect(dialogTriggered.value).toBe(false);
});
