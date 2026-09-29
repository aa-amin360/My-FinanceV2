// User-facing actions in the transaction modal and how they map to ledger types

export type TransactionAction = "INCOME" | "EXPENSE" | "TRANSFER" | "BORROW" | "GIVE" | "REPAY" | "RECEIVE";
export type ModalAction = TransactionAction | "NEW_GOAL";

export const ACTION_TO_TYPE: Record<TransactionAction, string> = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
  TRANSFER: "TRANSFER",
  BORROW: "DEBT_TAKEN",
  GIVE: "RECEIVABLE_GIVEN",
  REPAY: "DEBT_REPAID",
  RECEIVE: "RECEIVABLE_RECEIVED",
};

export const ACTION_TITLES: Record<ModalAction, string> = {
  INCOME: "Add Income",
  EXPENSE: "Add Expense",
  BORROW: "Borrow Money",
  GIVE: "Give Money",
  REPAY: "Repay Debt",
  RECEIVE: "Receive Money",
  TRANSFER: "Savings Deposit",
  NEW_GOAL: "Create Savings Goal",
};

// Actions that need a counterparty (person or bank)
export const COUNTERPARTY_ACTIONS: TransactionAction[] = ["BORROW", "GIVE", "REPAY", "RECEIVE"];

// Actions that need an income/expense category
export const CATEGORY_ACTIONS: TransactionAction[] = ["INCOME", "EXPENSE"];
