import pool, { withTransaction } from "@/backend/db/pool";
import { AppError } from "@/backend/http/AppError";
import { findAccountId } from "@/backend/repositories/accounts";
import {
  deleteGoal,
  findGoalNameForUpdate,
  GoalFields,
  insertGoal,
  listGoalsWithProgress,
  updateGoal as updateGoalRow,
} from "@/backend/repositories/savingsGoals";
import {
  deleteGoalTransactions,
  detachGoalTransactions,
  getGoalSavedAmount,
  insertTransaction,
} from "@/backend/repositories/transactions";
import type { GoalDeleteAction } from "@/backend/validators/savings";
import { TX_SOURCES } from "@/shared/transactionTypes";

export function listGoals(userId: string) {
  return listGoalsWithProgress(pool, userId);
}

export function createGoal(userId: string, goal: GoalFields) {
  return insertGoal(pool, userId, goal);
}

export async function updateGoal(userId: string, id: number, goal: GoalFields) {
  const updated = await updateGoalRow(pool, userId, id, goal);
  if (!updated) throw new AppError("Savings goal not found.", 404);
  return updated;
}

// REFUND: remove the goal's transfers so the money returns to Cash/Bank.
// SPENT:  record the saved amount as an expense from Savings, keep the history.
export async function removeGoal(userId: string, goalId: number, action: GoalDeleteAction, date: string) {
  await withTransaction(async (client) => {
    const goalName = await findGoalNameForUpdate(client, userId, goalId);
    if (goalName === null) {
      throw new AppError("Savings goal not found.", 404);
    }

    if (action === "REFUND") {
      await deleteGoalTransactions(client, userId, goalId);
    } else {
      const savingsAccountId = await findAccountId(client, "Savings", userId);
      const totalSaved = await getGoalSavedAmount(client, userId, goalId, savingsAccountId);

      if (totalSaved > 0 && savingsAccountId !== null) {
        await insertTransaction(client, userId, {
          type: "EXPENSE",
          amount: totalSaved,
          fromAccount: savingsAccountId,
          toAccount: null,
          date,
          note: `Goal Achieved & Spent: ${goalName}`,
          source: TX_SOURCES.GOAL_SPENT,
        });
      }

      // Keep the historic transfers but detach them from the goal being removed
      await detachGoalTransactions(client, userId, goalId);
    }

    await deleteGoal(client, userId, goalId);
  });
}
