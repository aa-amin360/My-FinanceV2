// Helpers for the month grid (month is 0-based, like Date#getMonth)

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Leading nulls pad the first week so day 1 lands on its weekday column
export function monthCells(year: number, month: number): Array<number | null> {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  return [
    ...Array.from({ length: firstDayIndex }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
}

// "YYYY-MM-DD" for a day of the given month
export function dayKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// First and last "YYYY-MM-DD" of the month
export function monthRange(year: number, month: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return { startDate: dayKey(year, month, 1), endDate: dayKey(year, month, lastDay) };
}
