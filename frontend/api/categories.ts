import { api } from "@/frontend/api/client";
import type { Category } from "@/shared/apiTypes";

export const categoriesApi = {
  list: () => api.get<{ data: Category[] }>("/api/categories").then((res) => res.data),
  create: (name: string, type: string) =>
    api.post<{ data: Category }>("/api/categories", { name, type }).then((res) => res.data),
};
