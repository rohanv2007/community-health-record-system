import { expect, test } from "@playwright/test";
import { login, suffix } from "./helpers";

test("Receptionist can register, search, open tabs, and edit patient info", async ({ page }) => {
  const id = suffix();
  const patientName = `E2E Patient ${id}`;
  const updatedAddress = `Updated address ${id}`;

  await login(page, "receptionist");
  await page.goto("/patients");
  await page.getByRole("button", { name: "New patient" }).click();
  await page.getByLabel("Full name").fill(patientName);
  await page.getByLabel("Date of birth").fill("1993-08-12");
  await page.getByLabel("Gender").selectOption("female");
  await page.getByLabel("Phone").fill(`98${id.slice(-8)}`);
  await page.getByLabel("Email").fill(`patient-${id}@example.com`);
  await page.getByLabel("Blood group").selectOption("O+");
  await page.getByLabel("Address").fill("Mysuru, Karnataka");
  await page.getByLabel("Allergies").fill("None");
  await page.getByLabel("Emergency contact").fill("Asha Rao");
  await page.getByRole("button", { name: "Register patient" }).click();
  await expect(page.getByText("Patient registered.")).toBeVisible();

  await page.getByPlaceholder("Search by name, ID, phone, blood group...").fill(patientName);
  await expect(page.getByRole("link", { name: patientName })).toBeVisible();
  await page.getByRole("link", { name: patientName }).click();

  await expect(page.getByRole("tab", { name: "Personal info" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Visit history" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Prescriptions" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Lab reports" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Billing" })).toBeVisible();

  await page.getByRole("button", { name: "Edit patient" }).click();
  await page.getByLabel("Address").fill(updatedAddress);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Patient updated.")).toBeVisible();
  await expect(page.getByText(updatedAddress)).toBeVisible();
});
