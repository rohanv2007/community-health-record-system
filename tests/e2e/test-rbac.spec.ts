import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("Receptionist cannot access admin-only doctors route", async ({ page }) => {
  await login(page, "receptionist");
  await page.goto("/doctors");
  await expect(page).toHaveURL(/\/403/);
  await expect(page.getByText("403: Restricted area")).toBeVisible();
});

test("Doctor cannot see billing module", async ({ page }) => {
  await login(page, "doctor");
  await expect(page.getByRole("link", { name: "Billing" })).toHaveCount(0);
  await page.goto("/billing");
  await expect(page).toHaveURL(/\/403/);
});

test("Admin can access protected modules and toggle dark mode on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page, "admin");
  await page.goto("/doctors");
  await expect(page.getByRole("heading", { name: "Doctors" })).toBeVisible();
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Clinic settings" })).toBeVisible();
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
