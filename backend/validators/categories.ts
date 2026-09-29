import type { JsonBody } from "@/backend/http/request";
import { parseEnum, parseRequiredText } from "@/backend/validators/common";

export const CATEGORY_TYPES = ["EXPENSE", "INCOME"] as const;

export function parseNewCategory(body: JsonBody) {
  return {
    name: parseRequiredText(body.name, "Category name", 60),
    type: parseEnum(body.type, CATEGORY_TYPES, "Category type"),
  };
}
