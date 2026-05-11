import { expect, test } from "@playwright/test";
import { login, selectFirstOption } from "./helpers";

test("Create invoice with multiple line items, verify tax, record payment, and download PDF", async ({ page }) => {
  await login(page, "receptionist");
  await page.goto("/billing");
  await page.getByRole("button", { name: "New invoice" }).click();
  await selectFirstOption(page, "Patient");
  await page.getByLabel("Tax rate %").fill("5");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByLabel("Line item 2 description").fill("Lab test");
  await page.getByLabel("Line item 2 quantity").fill("1");
  await page.getByLabel("Line item 2 unit price").fill("150");
  await expect(page.getByText(/Subtotal.*Tax.*Total/)).toBeVisible();
  await page.getByLabel("Initial payment").fill("0");
  await page.getByRole("dialog", { name: "Create invoice" }).getByRole("button", { name: "Create invoice" }).click();
  await expect(page.getByText("Invoice created.")).toBeVisible();

  await page.getByRole("button", { name: "Record" }).first().click();
  await page.getByRole("dialog", { name: "Record payment" }).getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByText("Payment recorded.")).toBeVisible();
  await expect(page.getByText("paid").first()).toBeVisible();

  const pdfLink = page.getByRole("link", { name: "PDF" }).first();
  await expect(pdfLink).toBeVisible({ timeout: 30_000 });
  const download = page.waitForEvent("download");
  await pdfLink.click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/HP-|TST-|\.pdf/);
});
