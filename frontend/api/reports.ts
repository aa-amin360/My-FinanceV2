import { api } from "@/frontend/api/client";
import type { Report, ReportRange, WeeklyExpense } from "@/shared/apiTypes";

export const reportsApi = {
  get: (range: ReportRange, today: string) => api.get<Report>("/api/reports", { range, today }),
  weeklyExpenses: (today: string) =>
    api.get<{ data: WeeklyExpense[] }>("/api/dashboard/weekly-expenses", { today }).then((res) => res.data),
};
