import { AppError } from "@/backend/http/AppError";
import type { JsonBody } from "@/backend/http/request";
import type { GoalFields } from "@/backend/repositories/savingsGoals";
import {
  parseAmount,
  parseEnum,
  parseInteger,
  parseOptionalAmount,
  parseOptionalDate,
  parseRequiredText,
} from "@/backend/validators/common";

export const GOAL_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY"] as const;
export const GOAL_DELETE_ACTIONS = ["REFUND", "SPENT"] as const;
export type GoalDeleteAction = (typeof GOAL_DELETE_ACTIONS)[number];

// WEEKLY reminders use JS weekday numbers (0 = Sunday), MONTHLY use the day of month
export function parseGoalInput(body: JsonBody): GoalFields {
  const frequency = parseEnum(body.frequency ?? "MONTHLY", GOAL_FREQUENCIES, "Frequency");
  const hasReminder = body.reminder_day !== undefined && body.reminder_day !== null && body.reminder_day !== "";

  let reminderDay: number | null = null;
  if (hasReminder && frequency === "MONTHLY") reminderDay = parseInteger(body.reminder_day, "Reminder day", 1, 31);
  if (hasReminder && frequency === "WEEKLY") reminderDay = parseInteger(body.reminder_day, "Reminder day", 0, 6);

  const targetAmount = parseAmount(body.target_amount, "Target amount");
  const installmentAmount = parseOptionalAmount(body.installment_amount, "Installment amount");
  if (installmentAmount !== null && installmentAmount > targetAmount) {
    throw new AppError("Installment amount cannot exceed the target amount.");
  }

  return {
    name: parseRequiredText(body.name, "Goal name", 100),
    targetAmount,
    installmentAmount,
    frequency,
    reminderDay,
    targetDate: parseOptionalDate(body.target_date, "Target date"),
  };
}
