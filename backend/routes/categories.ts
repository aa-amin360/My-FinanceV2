import { readJson } from "@/backend/http/request";
import { ok, route } from "@/backend/http/response";
import { requireUserId } from "@/backend/http/session";
import { createCategory, listCategories } from "@/backend/services/categories";
import { parseNewCategory } from "@/backend/validators/categories";

// GET /api/categories
export const getCategories = route("CATEGORY GET ERROR", async () => {
  const userId = await requireUserId();
  return ok({ data: await listCategories(userId) });
});

// POST /api/categories
export const postCategory = route("CATEGORY CREATE ERROR", async (req) => {
  const userId = await requireUserId();
  const { name, type } = parseNewCategory(await readJson(req));
  return ok({ data: await createCategory(userId, name, type) });
});
