import { expect, type Page } from "@playwright/test";

export const users = {
  admin: "admin@healthpoint.com",
  doctor: "doctor@healthpoint.com",
  receptionist: "reception@healthpoint.com",
} as const;

export async function login(page: Page, role: keyof typeof users) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(users[role]);
  await page.getByLabel("Password").fill("Demo@1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

export function suffix() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function todayAppointmentInput(minutesFromNoon = 0) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, minutesFromNoon % 55);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function futureAppointmentInput(seed = 0) {
  const date = new Date(2027, 0, 1 + (seed % 300), 9 + (seed % 8), seed % 55);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function upcomingAppointmentInput(seed = 0) {
  const now = new Date();
  const dayOffset = 1 + (seed % 20);
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, 9 + (seed % 8), seed % 55);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export async function selectFirstOption(page: Page, label: string) {
  await page.getByLabel(label).selectOption({ index: 1 });
}
