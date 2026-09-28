// Ledger rules shared by the API and the UI.
//
// Transactions form a one-level parent/child tree:
// - A normal repayment (DEBT_REPAID / RECEIVABLE_RECEIVED) is stored as a child of
//   the transaction that created the obligation. These "linked" children are real
//   user entries and can be deleted individually.
// - An overpayment is stored as a "split": a settlement-type parent holding the full
//   amount, plus auto-generated children holding the actual settlement and the
//   converted remainder. The parent only exists for display, so it is excluded
//   from balance calculations.

export const SETTLEMENT_TYPES = ["DEBT_REPAID", "RECEIVABLE_RECEIVED"] as const;
export const ORIGIN_TYPES = ["DEBT_TAKEN", "RECEIVABLE_GIVEN"] as const;

// Types that increase the user's spendable money
export const INFLOW_TYPES = ["INCOME", "DEBT_TAKEN", "RECEIVABLE_RECEIVED"] as const;

type LedgerRow = {
  type: string;
  parent_id?: number | string | null;
  has_child?: boolean;
};

export function isSettlementType(type: string) {
  return (SETTLEMENT_TYPES as readonly string[]).includes(type);
}

export function isInflowType(type: string) {
  return (INFLOW_TYPES as readonly string[]).includes(type);
}

// A split parent duplicates the amounts of its children and must not be counted
export function isSplitParent(row: LedgerRow) {
  return row.parent_id == null && !!row.has_child && isSettlementType(row.type);
}

// Rows that contribute to balances
export function isLedgerRow(row: LedgerRow) {
  return !isSplitParent(row);
}

// True when a child row was entered by the user (a repayment linked to an earlier
// obligation) rather than generated automatically by an overpayment split.
export function isUserLinkedChild(childType: string, parentType: string) {
  if (!isSettlementType(childType)) return false;
  if ((ORIGIN_TYPES as readonly string[]).includes(parentType)) return true;
  return childType !== parentType;
}

// SQL condition matching isLedgerRow for a transactions table alias
export function ledgerRowSql(alias: string) {
  return `(
    ${alias}.parent_id IS NOT NULL
    OR ${alias}.type NOT IN ('DEBT_REPAID', 'RECEIVABLE_RECEIVED')
    OR NOT EXISTS (SELECT 1 FROM transactions split_child WHERE split_child.parent_id = ${alias}.id)
  )`;
}

export function formatTypeLabel(type: string) {
  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatName(name: string) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
