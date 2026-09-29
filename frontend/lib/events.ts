// App-wide browser events used to coordinate independent parts of the UI.
//
// "refreshData" asks every mounted screen to reload (see hooks/useRefresh).
// "openAdd" opens the global TransactionModal, optionally pre-filled.

export const REFRESH_EVENT = "refreshData";
export const OPEN_TRANSACTION_MODAL_EVENT = "openAdd";

// String shortcuts open a specific form directly; "GENERAL" shows the action picker
export type TransactionModalShortcut = "GENERAL" | "TRANSACTION" | "DEBT" | "RECEIVABLE" | "NEW_GOAL";

export type TransactionModalPreset =
  | { type: "DEBT_REPAID" | "RECEIVABLE_RECEIVED"; entity: string }
  | {
      type: "TRANSFER";
      direction: "TO_SAVINGS" | "FROM_SAVINGS";
      goalId?: number;
      goalName?: string;
      amount?: string | number | null;
    };

export function requestRefresh() {
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

export function openTransactionModal(detail: TransactionModalShortcut | TransactionModalPreset = "GENERAL") {
  window.dispatchEvent(new CustomEvent(OPEN_TRANSACTION_MODAL_EVENT, { detail }));
}
