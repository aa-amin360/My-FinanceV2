import { api } from "@/frontend/api/client";
import type { NameAmount, OpeningBalanceStatus } from "@/shared/apiTypes";

export type HistoryInput = {
  cashBalance?: number;
  bankBalance?: number;
  debts: NameAmount[];
  receivables: NameAmount[];
  date: string;
};

export const historyApi = {
  status: () => api.get<OpeningBalanceStatus>("/api/transactions/history"),
  save: (input: HistoryInput) => api.post("/api/transactions/history", input),
};
