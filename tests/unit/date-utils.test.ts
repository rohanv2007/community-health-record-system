import {
  appointmentEndsAt,
  formatDate,
  formatDateTime,
  getAge,
  lastNDays,
  nextNDays,
  timeRangesOverlap,
} from "@/lib/date-utils";

describe("date utilities", () => {
  it("formats dates and date-times", () => {
    expect(formatDate("2026-05-11")).toBe("11 May 2026");
    expect(formatDateTime("2026-05-11T09:30:00.000Z")).toContain("11 May 2026");
  });

  it("calculates age, appointment end, and rolling day windows", () => {
    expect(getAge("1990-01-01", new Date("2026-05-11"))).toBe(36);
    expect(appointmentEndsAt("2026-05-11T10:00:00.000Z", 45).toISOString()).toBe("2026-05-11T10:45:00.000Z");
    expect(lastNDays(3, new Date("2026-05-11")).map((day) => day.iso)).toEqual([
      "2026-05-09",
      "2026-05-10",
      "2026-05-11",
    ]);
    expect(nextNDays(3, new Date("2026-05-11")).map((day) => day.iso)).toEqual([
      "2026-05-11",
      "2026-05-12",
      "2026-05-13",
    ]);
  });

  it("detects overlapping time ranges", () => {
    expect(
      timeRangesOverlap(
        new Date("2026-05-11T10:00:00Z"),
        new Date("2026-05-11T10:30:00Z"),
        new Date("2026-05-11T10:15:00Z"),
        new Date("2026-05-11T10:45:00Z")
      )
    ).toBe(true);
    expect(
      timeRangesOverlap(
        new Date("2026-05-11T10:00:00Z"),
        new Date("2026-05-11T10:30:00Z"),
        new Date("2026-05-11T10:30:00Z"),
        new Date("2026-05-11T11:00:00Z")
      )
    ).toBe(false);
  });
});
