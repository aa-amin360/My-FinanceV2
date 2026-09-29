import type { SavingsGoal } from "@/shared/apiTypes";

// Whether a goal's installment reminder falls on `today`.
// MONTHLY uses the day of month, WEEKLY the weekday (0 = Sunday), DAILY is always due.
export function isGoalDueToday(goal: Pick<SavingsGoal, "reminder_day" | "frequency">, today = new Date()) {
  if (goal.reminder_day === null || goal.reminder_day === undefined) return false;
  if (goal.frequency === "MONTHLY") return today.getDate() === goal.reminder_day;
  if (goal.frequency === "WEEKLY") return today.getDay() === goal.reminder_day;
  return goal.frequency === "DAILY";
}
