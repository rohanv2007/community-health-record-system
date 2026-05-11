import { expect, test } from "@playwright/test";
import { login, selectFirstOption, suffix, upcomingAppointmentInput } from "./helpers";

test("Book appointment, prevent double booking, complete it, and show it on calendar", async ({ page }) => {
  const id = suffix();
  const reason = `E2E appointment ${id}`;
  const scheduledAt = upcomingAppointmentInput(Number(id.slice(-4)));

  await login(page, "receptionist");
  await page.goto("/appointments");
  await page.getByRole("button", { name: "Book appointment" }).click();
  const bookingDialog = page.getByRole("dialog", { name: "Book appointment" });
  await selectFirstOption(page, "Patient");
  await selectFirstOption(page, "Doctor");
  await page.getByLabel("Date and time").fill(scheduledAt);
  await page.getByLabel("Duration (mins)").fill("30");
  await page.getByLabel("Reason").fill(reason);
  await bookingDialog.getByRole("button", { name: "Book appointment" }).click();
  await expect(page.getByText("Appointment booked.")).toBeVisible();

  await page.getByRole("button", { name: "Book appointment" }).click();
  const conflictDialog = page.getByRole("dialog", { name: "Book appointment" });
  await selectFirstOption(page, "Patient");
  await selectFirstOption(page, "Doctor");
  await page.getByLabel("Date and time").fill(scheduledAt);
  await page.getByLabel("Duration (mins)").fill("30");
  await page.getByLabel("Reason").fill(`${reason} conflict`);
  await conflictDialog.getByRole("button", { name: "Book appointment" }).click();
  await expect(page.getByText(/already has an appointment|already has an appointment in that slot/i)).toBeVisible();

  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "List" }).click();
  await page.getByPlaceholder("Search...").fill(reason);
  await expect(page.getByText(reason)).toBeVisible();
  await page.getByRole("button", { name: `Complete ${reason}` }).click();
  await expect(page.getByText("Appointment marked completed.")).toBeVisible();

  await page.getByRole("button", { name: "Calendar" }).click();
  await expect(page.getByText(reason)).toBeVisible();
});
