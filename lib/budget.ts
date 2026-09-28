import type { DbClient } from "@/lib/db";
import { AppError } from "@/lib/errors";

export const PLAN_TYPES = ["EXPENSE", "INCOME"] as const;
export const PLAN_STATUSES = ["PENDING", "CONFIRMED", "SKIPPED"] as const;

// Plans may point at a category; make sure it is the user's and matches the plan type
export async function assertPlanCategory(
  client: DbClient,
  userId: string,
  categoryId: number | null,
  planType: string
) {
  if (!categoryId) return;

  const res = await client.query(
    `SELECT type FROM categories WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
    [categoryId, userId]
  );
  if (res.rows.length === 0) throw new AppError("Category not found.", 404);
  if (res.rows[0].type !== planType) {
    throw new AppError("The selected category does not match the plan type.");
  }
}

// budget_plans.target_id is stored as text; turn it back into a category id
export function planCategoryId(targetId: unknown): number | null {
  const id = Number(targetId);
  return Number.isInteger(id) && id > 0 ? id : null;
}
