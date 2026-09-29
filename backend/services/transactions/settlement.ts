import type { Db } from "@/backend/db/pool";
import { AppError } from "@/backend/http/AppError";
import type { AccountIds } from "@/backend/repositories/accounts";
import {
  addObligation,
  clearObligation,
  getRemainingForUpdate,
  ObligationTable,
  reduceObligation,
} from "@/backend/repositories/obligations";
import { findSettlementOrigin, insertTransaction, NewTransaction } from "@/backend/repositories/transactions";
import type { Flow } from "@/backend/services/transactions/flow";
import { TX_SOURCES } from "@/shared/transactionTypes";

export type SettlementType = "DEBT_REPAID" | "RECEIVABLE_RECEIVED";

type SettlementConfig = {
  table: ObligationTable;
  // Root transaction type that creates the obligation
  originType: "DEBT_TAKEN" | "RECEIVABLE_GIVEN";
  // An overpayment of the opposite kind can also create this obligation
  crossSplitType: SettlementType;
  // What any overpaid remainder turns into
  overflowType: "RECEIVABLE_GIVEN" | "DEBT_TAKEN";
  overflowTable: ObligationTable;
  overflowFlow: (flow: Flow, ids: AccountIds) => Flow;
  nothingToSettle: string;
};

const CONFIG: Record<SettlementType, SettlementConfig> = {
  // Repaying a debt: an overpayment means the counterparty now owes the user
  DEBT_REPAID: {
    table: "debts",
    originType: "DEBT_TAKEN",
    crossSplitType: "RECEIVABLE_RECEIVED",
    overflowType: "RECEIVABLE_GIVEN",
    overflowTable: "receivables",
    overflowFlow: (flow, ids) => ({ from_account: flow.from_account, to_account: ids.receivableId }),
    nothingToSettle: "There is no outstanding debt with this person.",
  },
  // Collecting a receivable: over-collecting means the user now owes the counterparty
  RECEIVABLE_RECEIVED: {
    table: "receivables",
    originType: "RECEIVABLE_GIVEN",
    crossSplitType: "DEBT_REPAID",
    overflowType: "DEBT_TAKEN",
    overflowTable: "debts",
    overflowFlow: (flow, ids) => ({ from_account: ids.debtId, to_account: flow.to_account }),
    nothingToSettle: "There is nothing outstanding from this person.",
  },
};

type SettleArgs = {
  db: Db;
  type: SettlementType;
  userId: string;
  entityId: number;
  amount: number;
  flow: Flow;
  ids: AccountIds;
  categoryId: number | null;
  date: string;
  note: string | null;
};

// Record a repayment or collection against an existing obligation.
export async function settleObligation(args: SettleArgs) {
  const { db, type, userId, entityId, amount, flow, ids, categoryId, date, note } = args;
  const config = CONFIG[type];

  const row = (overrides: Partial<NewTransaction>): NewTransaction => ({
    type,
    amount,
    fromAccount: flow.from_account,
    toAccount: flow.to_account,
    entityId,
    categoryId,
    date,
    note,
    ...overrides,
  });

  const remaining = await getRemainingForUpdate(db, config.table, entityId, userId);
  if (remaining <= 0) {
    throw new AppError(config.nothingToSettle);
  }

  // Overpayment: split into the actual settlement plus a converted remainder
  if (amount > remaining) {
    const extra = Math.round((amount - remaining) * 100) / 100;

    const parentId = await insertTransaction(db, userId, row({ parentId: null }));
    await insertTransaction(db, userId, row({ amount: remaining, parentId }));
    await clearObligation(db, config.table, entityId, userId);

    const overflow = config.overflowFlow(flow, ids);
    await addObligation(db, config.overflowTable, entityId, extra, userId);
    await insertTransaction(db, userId, {
      type: config.overflowType,
      amount: extra,
      fromAccount: overflow.from_account,
      toAccount: overflow.to_account,
      entityId,
      categoryId: null,
      date,
      note: "Auto conversion",
      parentId,
      source: TX_SOURCES.AUTO_CONVERSION,
    });
    return;
  }

  // Normal settlement: link it to the transaction that created the obligation
  const originId = await findSettlementOrigin(db, userId, entityId, config.originType, config.crossSplitType);

  if (originId !== null) {
    await insertTransaction(db, userId, row({ parentId: originId }));
  } else {
    // No origin found: keep the same parent/child shape so it is excluded consistently
    const parentId = await insertTransaction(db, userId, row({ parentId: null }));
    await insertTransaction(db, userId, row({ parentId }));
  }

  await reduceObligation(db, config.table, entityId, amount, userId);
}
