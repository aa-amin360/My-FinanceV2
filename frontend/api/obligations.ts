import { api } from "@/frontend/api/client";
import type { ObligationRow } from "@/shared/apiTypes";

export type ObligationResource = "debts" | "receivables";

export const obligationsApi = {
  total: (resource: ObligationResource) =>
    api.get<{ total: number }>(`/api/${resource}`).then((res) => Number(res.total || 0)),
  details: (resource: ObligationResource) =>
    api.get<{ data: ObligationRow[] }>(`/api/${resource}/details`).then((res) => res.data),
};
