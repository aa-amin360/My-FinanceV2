import { AppError } from "@/backend/http/AppError";
import type { JsonBody } from "@/backend/http/request";
import type { NewPlan } from "@/backend/repositories/budgetPlans";
import { SPENDABLE_ACCOUNTS, SpendableAccount } from "@/shared/config";
import {
  dateOrToday,
  parseAmount,
  parseDate,
  parseEnum,
  parseInteger,
  parseOptionalId,
  parseRequiredText,
  parseText,
} from "@/backend/validators/common";

export const PLAN_TYPES = ["EXPENSE", "INCOME"] as const;
// Confirming a plan creates a transaction, so it only happens through the process endpoint
export const EDITABLE_PLAN_STATUSES = ["PENDING", "SKIPPED"] as const;
export const PROCESS_ACTIONS = ["CONFIRM", "PARTIAL"] as const;

export function parseMonthQuery(params: URLSearchParams) {
  return {
    month: parseInteger(params.get("month"), "Month", 1, 12),
    year: parseInteger(params.get("year"), "Year", 1900, 3000),
  };
}

export function parseNewPlan(body: JsonBody): NewPlan {
  return {
    type: parseEnum(body.type, PLAN_TYPES, "Planning type"),
    amount: parseAmount(body.amount),
    targetName: parseRequiredText(body.target_name, "Target", 255),
    date: parseDate(body.date),
    note: parseText(body.note, "Note", { max: 500, required: false }),
    categoryId: parseOptionalId(body.target_id, "Category"),
  };
}

export type PlanUpdate = {
  status?: (typeof EDITABLE_PLAN_STATUSES)[number];
  amount?: number;
  date?: string;
  note?: string | null;
  targetName?: string;
  // undefined = unchanged, null = clear the category
  categoryId?: number | null;
};

export function parsePlanUpdate(body: JsonBody): PlanUpdate {
  const update: PlanUpdate = {};
  if (body.status !== undefined) update.status = parseEnum(body.status, EDITABLE_PLAN_STATUSES, "Status");
  if (body.amount !== undefined) update.amount = parseAmount(body.amount);
  if (body.date !== undefined) update.date = parseDate(body.date);
  if (body.note !== undefined) update.note = parseText(body.note, "Note", { max: 500, required: false });
  if (body.target_name !== undefined) update.targetName = parseRequiredText(body.target_name, "Target", 255);
  if (body.target_id !== undefined) update.categoryId = parseOptionalId(body.target_id, "Category");

  if (Object.keys(update).length === 0) {
    throw new AppError("No update fields provided.");
  }
  return update;
}

export type ProcessPlanInput = {
  action: (typeof PROCESS_ACTIONS)[number];
  account: SpendableAccount;
  date: string;
  // Only used for PARTIAL; validated against the plan amount in the service
  rawAmount: unknown;
};

export function parseProcessPlan(body: JsonBody): ProcessPlanInput {
  return {
    action: parseEnum(body.action, PROCESS_ACTIONS, "Action"),
    account: parseEnum(body.account, SPENDABLE_ACCOUNTS, "Account"),
    date: dateOrToday(body.date),
    rawAmount: body.amount,
  };
}

export function parsePartialAmount(value: unknown) {
  return parseAmount(value, "Partial amount");
}

// budget_plans.target_id is stored as text; turn it back into a category id
export function planCategoryId(targetId: unknown): number | null {
  const id = Number(targetId);
  return Number.isInteger(id) && id > 0 ? id : null;
}
