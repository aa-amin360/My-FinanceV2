import { api } from "@/frontend/api/client";
import type { SavingsGoal } from "@/shared/apiTypes";

export type GoalInput = {
  name: string;
  target_amount: string | number;
  target_date: string | null;
  installment_amount: string | number | null;
  frequency: string;
  reminder_day: number | null;
};

export const savingsApi = {
  list: () => api.get<{ data: SavingsGoal[] }>("/api/savings").then((res) => res.data),
  create: (goal: GoalInput) => api.post<{ data: SavingsGoal }>("/api/savings", goal).then((res) => res.data),
  update: (id: number, goal: GoalInput) =>
    api.put<{ data: SavingsGoal }>(`/api/savings/${id}`, goal).then((res) => res.data),
  // REFUND returns the money to Cash/Bank; SPENT records it as an expense
  remove: (id: number, action: "REFUND" | "SPENT", date: string) =>
    api.delete(`/api/savings/${id}`, { action, date }),
};
