import { api } from "@/frontend/api/client";
import type { TransactionPage } from "@/shared/apiTypes";

export type TransactionQuery = {
  page?: number;
  limit?: number;
  all?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  entityId?: number | string;
};

export type NewTransaction = {
  type: string;
  amount: number;
  account: string;
  date: string;
  note?: string | null;
  direction?: string | null;
  entity?: string;
  category_id?: number | string;
  savings_goal_id?: number | null;
};

export const transactionsApi = {
  list: (query: TransactionQuery = {}) => api.get<TransactionPage>("/api/transactions", query),
  create: (tx: NewTransaction) => api.post("/api/transactions", tx),
  remove: (id: number | string) => api.delete(`/api/transactions/${id}`),
  // Deletes every transaction and resets onboarding
  removeAll: () => api.delete("/api/transactions/all"),
};
