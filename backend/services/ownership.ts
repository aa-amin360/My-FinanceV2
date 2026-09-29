import type { Db } from "@/backend/db/pool";
import { AppError } from "@/backend/http/AppError";
import { findCategoryType } from "@/backend/repositories/categories";
import { goalExists } from "@/backend/repositories/savingsGoals";

// Ensure a category is visible to the user and is meant for this kind of entry
export async function assertCategoryMatches(db: Db, userId: string, categoryId: number | null, expectedType: string) {
  if (!categoryId) return;

  const type = await findCategoryType(db, userId, categoryId);
  if (!type) throw new AppError("Category not found.", 404);
  if (type !== expectedType) {
    throw new AppError(`That category is for ${type.toLowerCase()}, not ${expectedType.toLowerCase()}.`);
  }
}

export async function assertGoalOwned(db: Db, userId: string, goalId: number | null) {
  if (!goalId) return;
  if (!(await goalExists(db, userId, goalId))) {
    throw new AppError("Savings goal not found.", 404);
  }
}
