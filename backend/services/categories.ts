import pool from "@/backend/db/pool";
import { AppError } from "@/backend/http/AppError";
import { insertCategoryIfNew, listCategoriesWithTotals } from "@/backend/repositories/categories";

export function listCategories(userId: string) {
  return listCategoriesWithTotals(pool, userId);
}

export async function createCategory(userId: string, name: string, type: string) {
  const category = await insertCategoryIfNew(pool, userId, name, type);
  if (!category) {
    throw new AppError(`A ${type.toLowerCase()} category named "${name}" already exists.`, 409);
  }
  return category;
}
