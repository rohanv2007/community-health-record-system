import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("Admin can log in with demo credentials", async ({ page }) => {
  await login(page, "admin");
  await expect(page.getByRole("banner").getByText("Ananya Rao")).toBeVisible();
});

test("Invalid credentials show error toast", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("wrong@example.com");
  await page.getByLabel("Password").fill("DefinitelyWrong123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText(/invalid|login failed/i)).toBeVisible();
});

test("Password reset email is triggered", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("admin@healthpoint.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/reset email triggered|reset link|check your inbox/i)).toBeVisible();
});
