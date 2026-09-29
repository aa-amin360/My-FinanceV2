import { api } from "@/frontend/api/client";
import type { Balances } from "@/shared/apiTypes";

export const balanceApi = {
  get: () => api.get<Balances>("/api/balance"),
};
