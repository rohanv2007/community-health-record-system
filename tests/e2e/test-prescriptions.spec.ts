import { expect, test } from "@playwright/test";
import { futureAppointmentInput, login, selectFirstOption, suffix } from "./helpers";

test("Doctor creates prescription for a completed appointment and downloads PDF", async ({ page }) => {
  const id = suffix();
  const reason = `E2E prescription appointment ${id}`;
  const diagnosis = `E2E diagnosis ${id}`;

  await login(page, "doctor");
  await page.goto("/appointments");
  await page.getByRole("button", { name: "Book appointment" }).click();
  const bookingDialog = page.getByRole("dialog", { name: "Book appointment" });
  await selectFirstOption(page, "Patient");
  await selectFirstOption(page, "Doctor");
  await page.getByLabel("Date and time").fill(futureAppointmentInput(Number(id.slice(-2))));
  await page.getByLabel("Duration (mins)").fill("30");
  await page.getByLabel("Reason").fill(reason);
  await bookingDialog.getByRole("button", { name: "Book appointment" }).click();
  await expect(page.getByText("Appointment booked.")).toBeVisible();

  await page.getByRole("button", { name: "List" }).click();
  await page.getByPlaceholder("Search...").fill(reason);
  await page.getByRole("button", { name: `Complete ${reason}` }).click();
  await expect(page.getByText("Appointment marked completed.")).toBeVisible();

  await page.goto("/prescriptions");
  await page.getByRole("button", { name: "New prescription" }).click();
  const appointmentValue = await page.getByLabel("Completed appointment").locator("option", { hasText: reason }).getAttribute("value");
  expect(appointmentValue).toBeTruthy();
  await page.getByLabel("Completed appointment").selectOption(appointmentValue!);
  await selectFirstOption(page, "Doctor");
  await page.getByLabel("Diagnosis").fill(diagnosis);
  await page.getByRole("button", { name: "Create prescription" }).click();
  await expect(page.getByText("Prescription created.")).toBeVisible();
  await expect(page.getByText(diagnosis)).toBeVisible();

  const pdfLink = page.getByRole("link", { name: "Download" }).first();
  await expect(pdfLink).toBeVisible({ timeout: 30_000 });
  const download = page.waitForEvent("download");
  await pdfLink.click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/prescription-.*\.pdf/);
});
