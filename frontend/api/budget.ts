import { api } from "@/frontend/api/client";
import type { BudgetPlan } from "@/shared/apiTypes";

export type NewPlan = {
  type: "EXPENSE" | "INCOME";
  amount: number;
  target_id: number | string | null;
  target_name: string;
  date: string;
  note: string | null;
};

export type PlanUpdate = Partial<Pick<BudgetPlan, "status" | "date" | "note" | "target_name">> & {
  amount?: number;
  target_id?: number | string | null;
};

export type ProcessPlan = {
  action: "CONFIRM" | "PARTIAL";
  account: string;
  date: string;
  amount?: number;
};

export const budgetApi = {
  list: (month: number, year: number) =>
    api.get<{ data: BudgetPlan[] }>("/api/budget", { month, year }).then((res) => res.data),
  create: (plan: NewPlan) => api.post<{ data: BudgetPlan }>("/api/budget", plan).then((res) => res.data),
  update: (id: number, update: PlanUpdate) =>
    api.put<{ data: BudgetPlan }>(`/api/budget/${id}`, update).then((res) => res.data),
  remove: (id: number) => api.delete(`/api/budget/${id}`),
  // Creates the real transaction and updates the plan atomically
  process: (id: number, input: ProcessPlan) => api.post(`/api/budget/${id}/process`, input),
};
