import { getISOWeek, getISOWeekYear, startOfISOWeek, addDays, format } from "date-fns";

export function getWeekNumber(date: Date): number {
  return getISOWeek(date);
}

export function getWeekYear(date: Date): number {
  return getISOWeekYear(date);
}

export function getDayOfWeek(date: Date): number {
  // 0 = Monday, 6 = Sunday (ISO standard)
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export function getWeekDates(year: number, week: number): Date[] {
  // Get the first day (Monday) of the given ISO week
  const jan4 = new Date(year, 0, 4);
  const weekStart = startOfISOWeek(jan4);
  const targetStart = addDays(weekStart, (week - 1) * 7);

  return Array.from({ length: 7 }, (_, i) => addDays(targetStart, i));
}

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDisplayDate(date: Date): string {
  return format(date, "EEE, MMM d");
}

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_NAMES_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
