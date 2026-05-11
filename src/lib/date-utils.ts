import {
  addDays,
  differenceInCalendarYears,
  endOfDay,
  format,
  isBefore,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

export function formatDate(value: string | Date, pattern = "dd MMM yyyy") {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, pattern);
}

export function formatDateTime(value: string | Date) {
  return formatDate(value, "dd MMM yyyy, hh:mm a");
}

export function getAge(dob: string, today = new Date()) {
  return differenceInCalendarYears(today, parseISO(dob));
}

export function lastNDays(days: number, today = new Date()) {
  return Array.from({ length: days }, (_, index) => {
    const date = subDays(today, days - index - 1);
    return {
      date,
      label: format(date, "dd MMM"),
      iso: format(date, "yyyy-MM-dd"),
      start: startOfDay(date),
      end: endOfDay(date),
    };
  });
}

export function nextNDays(days: number, today = new Date()) {
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(today, index);
    return {
      date,
      label: format(date, "dd MMM"),
      iso: format(date, "yyyy-MM-dd"),
      start: startOfDay(date),
      end: endOfDay(date),
    };
  });
}

export function appointmentEndsAt(scheduledAt: string | Date, durationMins: number) {
  const start = typeof scheduledAt === "string" ? parseISO(scheduledAt) : scheduledAt;
  return new Date(start.getTime() + durationMins * 60_000);
}

export function timeRangesOverlap(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date
) {
  return isBefore(leftStart, rightEnd) && isBefore(rightStart, leftEnd);
}

export function nextFollowUpDate(days = 14) {
  return format(addDays(new Date(), days), "yyyy-MM-dd");
}
