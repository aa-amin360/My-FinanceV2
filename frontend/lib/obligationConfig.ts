import type { ObligationResource } from "@/frontend/api/obligations";
import { openTransactionModal } from "@/frontend/lib/events";

// Everything that differs between the Debts and Receivables screens

export type ObligationKind = "debt" | "receivable";

export type ObligationConfig = {
  title: string;
  subtitle: string;
  detailTitle: string;
  basePath: string;
  resource: ObligationResource;
  emptyText: string;
  originType: "DEBT_TAKEN" | "RECEIVABLE_GIVEN";
  settleType: "DEBT_REPAID" | "RECEIVABLE_RECEIVED";
  originLabel: string;
  settledLabel: string;
  actionLabel: string;
  amountClass: string;
  actionClass: string;
};

export const OBLIGATION_CONFIG: Record<ObligationKind, ObligationConfig> = {
  debt: {
    title: "Debts",
    subtitle: "Track and manage outstanding loans you owe to others.",
    detailTitle: "Debt Details",
    basePath: "/debts",
    resource: "debts",
    emptyText: "No active debts on your ledger.",
    originType: "DEBT_TAKEN",
    settleType: "DEBT_REPAID",
    originLabel: "Total Taken",
    settledLabel: "Total Repaid",
    actionLabel: "Repay",
    amountClass: "text-rose-600 dark:text-rose-400",
    actionClass: "bg-green-500 hover:bg-green-400 text-black shadow-sm shadow-green-500/10",
  },
  receivable: {
    title: "Receivables",
    subtitle: "Track and manage outstanding funds owed to you by others.",
    detailTitle: "Receivable Details",
    basePath: "/receivables",
    resource: "receivables",
    emptyText: "No active receivables on your ledger.",
    originType: "RECEIVABLE_GIVEN",
    settleType: "RECEIVABLE_RECEIVED",
    originLabel: "Total Given",
    settledLabel: "Total Received",
    actionLabel: "Receive",
    amountClass: "text-amber-600 dark:text-amber-400",
    actionClass:
      "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
  },
};

// Open the transaction modal pre-filled to repay/collect from this person
export function openSettleModal(config: ObligationConfig, entityName: string) {
  openTransactionModal({ type: config.settleType, entity: entityName });
}
