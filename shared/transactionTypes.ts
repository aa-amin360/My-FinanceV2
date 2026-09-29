export const TYPE_META = {
  INCOME: { flow: "IN", group: "BALANCE" },
  EXPENSE: { flow: "OUT", group: "BALANCE" },
  TRANSFER: { flow: "MOVE", group: "BALANCE" },
  DEBT_TAKEN: { flow: "IN", group: "DEBT" },
  DEBT_REPAID: { flow: "OUT", group: "DEBT" },
  RECEIVABLE_GIVEN: { flow: "OUT", group: "RECEIVABLE" },
  RECEIVABLE_RECEIVED: { flow: "IN", group: "RECEIVABLE" },
} as const;

export type TxType = keyof typeof TYPE_META;
export const TX_TYPES = Object.keys(TYPE_META) as TxType[];

export const TRANSFER_DIRECTIONS = ["TO_SAVINGS", "FROM_SAVINGS"] as const;
export type TransferDirection = (typeof TRANSFER_DIRECTIONS)[number];

// Marks rows created by the system rather than typed in by the user
export const TX_SOURCES = {
  OPENING_BALANCE: "OPENING_BALANCE",
  OPENING_DEBT: "OPENING_DEBT",
  OPENING_RECEIVABLE: "OPENING_RECEIVABLE",
  AUTO_CONVERSION: "AUTO_CONVERSION",
  GOAL_SPENT: "GOAL_SPENT",
} as const;
