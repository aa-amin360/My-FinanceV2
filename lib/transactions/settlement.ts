import type { DbClient } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { AccountIds } from "@/lib/transactions/accounts";
import type { Flow } from "@/lib/transactions/flow";
import { addObligation, clearObligation, getRemaining, ObligationTable, reduceObligation } from "@/lib/transactions/obligations";
import { TX_SOURCES } from "@/lib/transactions/types";

type SettlementType = "DEBT_REPAID" | "RECEIVABLE_RECEIVED";

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
    overflowFlow: (flow, ids) => ({ from_account: ids.debtId, to_account: flow.to_account }),
    overflowTable: "debts",
    nothingToSettle: "There is nothing outstanding from this person.",
  },
};

type SettleArgs = {
  client: DbClient;
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

async function insertRow(
  client: DbClient,
  values: {
    type: string;
    amount: number;
    flow: Flow;
    entityId: number;
    categoryId: number | null;
    date: string;
    note: string | null;
    parentId: number | null;
    userId: string;
    source?: string | null;
  }
): Promise<number> {
  const res = await client.query(
    `INSERT INTO transactions
     (type, amount, from_account, to_account, entity_id, category_id, date, note, parent_id, user_id, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      values.type,
      values.amount,
      values.flow.from_account,
      values.flow.to_account,
      values.entityId,
      values.categoryId,
      values.date,
      values.note,
      values.parentId,
      values.userId,
      values.source ?? null,
    ]
  );
  return res.rows[0].id;
}

// Record a repayment or collection against an existing obligation.
export async function settleObligation(args: SettleArgs) {
  const { client, type, userId, entityId, amount, flow, ids, categoryId, date, note } = args;
  const config = CONFIG[type];
  const row = { type, flow, entityId, categoryId, date, note, userId };

  const remaining = await getRemaining(client, config.table, entityId, userId);
  if (remaining <= 0) {
    throw new AppError(config.nothingToSettle);
  }

  // Overpayment: split into the actual settlement plus a converted remainder
  if (amount > remaining) {
    const extra = Math.round((amount - remaining) * 100) / 100;

    const parentId = await insertRow(client, { ...row, amount, parentId: null });
    await insertRow(client, { ...row, amount: remaining, parentId });
    await clearObligation(client, config.table, entityId, userId);

    await addObligation(client, config.overflowTable, entityId, extra, userId);
    await insertRow(client, {
      type: config.overflowType,
      amount: extra,
      flow: config.overflowFlow(flow, ids),
      entityId,
      categoryId: null,
      date,
      note: "Auto conversion",
      parentId,
      userId,
      source: TX_SOURCES.AUTO_CONVERSION,
    });
    return;
  }

  // Normal settlement: link it to the transaction that created the obligation
  const originRes = await client.query(
    `
    SELECT t.id
    FROM transactions t
    WHERE t.entity_id = $1
      AND t.user_id = $2
      AND t.parent_id IS NULL
      AND (
        t.type = $3
        OR (
          t.type = $4
          AND EXISTS (
            SELECT 1 FROM transactions t2
            WHERE t2.parent_id = t.id AND t2.type = $3
          )
        )
      )
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT 1
    `,
    [entityId, userId, config.originType, config.crossSplitType]
  );

  if (originRes.rows.length > 0) {
    await insertRow(client, { ...row, amount, parentId: originRes.rows[0].id });
  } else {
    // No origin found: keep the same parent/child shape so it is excluded consistently
    const parentId = await insertRow(client, { ...row, amount, parentId: null });
    await insertRow(client, { ...row, amount, parentId });
  }

  await reduceObligation(client, config.table, entityId, amount, userId);
}
