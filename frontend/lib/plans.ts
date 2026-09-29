import type { BudgetPlan } from "@/shared/apiTypes";

// A pending plan whose date is before `today` (YYYY-MM-DD)
export function isOverdue(plan: Pick<BudgetPlan, "status" | "date">, today: string) {
  return plan.status === "PENDING" && plan.date.substring(0, 10) < today;
}
