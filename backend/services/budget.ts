import pool, { withTransaction } from "@/backend/db/pool";
import { AppError } from "@/backend/http/AppError";
import {
  deletePlan as deletePlanRow,
  findPlan,
  insertPlan,
  listPlansForMonth,
  NewPlan,
  PlanChanges,
  updatePlan as updatePlanRow,
} from "@/backend/repositories/budgetPlans";
import { assertCategoryMatches } from "@/backend/services/ownership";
import { createTransaction } from "@/backend/services/transactions/create";
import { parsePartialAmount, planCategoryId, PlanUpdate, ProcessPlanInput } from "@/backend/validators/budget";
import { subtractMoney } from "@/shared/money";

export function listPlans(userId: string, month: number, year: number) {
  return listPlansForMonth(pool, userId, month, year);
}

export async function createPlan(userId: string, plan: NewPlan) {
  await assertCategoryMatches(pool, userId, plan.categoryId, plan.type);
  return insertPlan(pool, userId, plan);
}

export async function updatePlan(userId: string, id: number, update: PlanUpdate) {
  const changes: PlanChanges = {};
  if (update.status !== undefined) changes.status = update.status;
  if (update.amount !== undefined) changes.amount = update.amount;
  if (update.date !== undefined) changes.date = update.date;
  if (update.note !== undefined) changes.note = update.note;
  if (update.targetName !== undefined) changes.target_name = update.targetName;

  if (update.categoryId !== undefined) {
    const plan = await findPlan(pool, userId, id);
    if (!plan) throw new AppError("Plan not found.", 404);
    await assertCategoryMatches(pool, userId, update.categoryId, plan.type);
    changes.target_id = update.categoryId ? String(update.categoryId) : null;
  }

  const updated = await updatePlanRow(pool, userId, id, changes);
  if (!updated) throw new AppError("Plan not found.", 404);
  return updated;
}

export async function deletePlan(userId: string, id: number) {
  if (!(await deletePlanRow(pool, userId, id))) {
    throw new AppError("Plan not found.", 404);
  }
}

// Turn a planned item into a real transaction. The transaction and the plan
// update happen in one database transaction so a failure can never leave a
// recorded payment with a still-pending plan.
export async function processPlan(userId: string, id: number, input: ProcessPlanInput) {
  await withTransaction(async (client) => {
    const plan = await findPlan(client, userId, id, { forUpdate: true });
    if (!plan) throw new AppError("Plan not found.", 404);
    if (plan.status !== "PENDING") throw new AppError("This plan has already been processed.");

    const planAmount = Number(plan.amount);
    const isConfirm = input.action === "CONFIRM";
    const amount = isConfirm ? planAmount : parsePartialAmount(input.rawAmount);
    if (!isConfirm && amount >= planAmount) {
      throw new AppError("Partial amount must be less than the planned amount.");
    }

    const suffix = isConfirm ? "(Planned)" : "(Partial planned)";
    const fallbackNote = isConfirm ? "Planned event confirmed" : "Partial planned event";

    await createTransaction(client, userId, {
      type: plan.type,
      amount,
      account: input.account,
      date: input.date,
      note: plan.note ? `${plan.note} ${suffix}` : fallbackNote,
      direction: null,
      entity: null,
      categoryId: planCategoryId(plan.target_id),
      savingsGoalId: null,
    });

    await updatePlanRow(
      client,
      userId,
      id,
      isConfirm ? { status: "CONFIRMED" } : { amount: subtractMoney(planAmount, amount) }
    );
  });
}
