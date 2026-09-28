import type { DbClient } from "@/lib/db";
import { SPENDABLE_ACCOUNTS, SpendableAccount } from "@/lib/config";
import { AppError } from "@/lib/errors";
import { parseAmount, parseDate, parseEnum, parseOptionalId, parseText } from "@/lib/validation";
import { resolveAccounts } from "@/lib/transactions/accounts";
import { checkBalance } from "@/lib/transactions/balance";
import { resolveEntity } from "@/lib/transactions/entity";
import { buildFlow } from "@/lib/transactions/flow";
import { addObligation } from "@/lib/transactions/obligations";
import { settleObligation } from "@/lib/transactions/settlement";
import { TRANSFER_DIRECTIONS, TransferDirection, TX_TYPES, TYPE_META, TxType } from "@/lib/transactions/types";

export type CreateTransactionInput = {
  type: TxType;
  amount: number;
  account: SpendableAccount;
  date: string;
  note: string | null;
  direction: TransferDirection | null;
  entity: string | null;
  categoryId: number | null;
  savingsGoalId: number | null;
};

export function parseCreateTransactionInput(body: Record<string, unknown>): CreateTransactionInput {
  const type = parseEnum(body.type, TX_TYPES, "Transaction type");
  const { group } = TYPE_META[type];

  return {
    type,
    amount: parseAmount(body.amount),
    account: parseEnum(body.account, SPENDABLE_ACCOUNTS, "Account"),
    date: parseDate(body.date),
    note: parseText(body.note, "Note", { max: 500, required: false }),
    direction: type === "TRANSFER" ? parseEnum(body.direction, TRANSFER_DIRECTIONS, "Direction") : null,
    entity: group === "BALANCE" ? null : parseText(body.entity, "Counterparty", { max: 100 }),
    categoryId: type === "INCOME" || type === "EXPENSE" ? parseOptionalId(body.category_id, "Category") : null,
    savingsGoalId: type === "TRANSFER" ? parseOptionalId(body.savings_goal_id, "Savings goal") : null,
  };
}

// Make sure referenced rows belong to the user (or are shared defaults)
async function assertOwnership(client: DbClient, userId: string, input: CreateTransactionInput) {
  if (input.categoryId) {
    const res = await client.query(
      `SELECT type FROM categories WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [input.categoryId, userId]
    );
    if (res.rows.length === 0) throw new AppError("Category not found.", 404);
    if (res.rows[0].type !== input.type) {
      throw new AppError(`That category is for ${String(res.rows[0].type).toLowerCase()}, not ${input.type.toLowerCase()}.`);
    }
  }

  if (input.savingsGoalId) {
    const res = await client.query(`SELECT 1 FROM savings_goals WHERE id = $1 AND user_id = $2`, [
      input.savingsGoalId,
      userId,
    ]);
    if (res.rows.length === 0) throw new AppError("Savings goal not found.", 404);
  }
}

// Record a transaction and keep debt/receivable totals in sync.
// Must run inside a database transaction (see withTransaction).
export async function createTransaction(client: DbClient, userId: string, input: CreateTransactionInput) {
  await assertOwnership(client, userId, input);

  const ids = await resolveAccounts(client, input.account, userId);
  const entityId = await resolveEntity(client, input.entity, input.type, userId);
  const flow = buildFlow(input.type, input.direction, ids, entityId);

  const sourceAccount =
    input.type === "TRANSFER" && input.direction === "FROM_SAVINGS" ? ids.savingsId : ids.accountId;
  await checkBalance(client, sourceAccount, userId, input.type, input.amount);

  if (input.type === "DEBT_REPAID" || input.type === "RECEIVABLE_RECEIVED") {
    await settleObligation({
      client,
      type: input.type,
      userId,
      entityId: entityId as number,
      amount: input.amount,
      flow,
      ids,
      categoryId: input.categoryId,
      date: input.date,
      note: input.note,
    });
    return;
  }

  await client.query(
    `INSERT INTO transactions
     (type, amount, from_account, to_account, entity_id, category_id, date, note, user_id, savings_goal_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      input.type,
      input.amount,
      flow.from_account,
      flow.to_account,
      entityId,
      input.categoryId,
      input.date,
      input.note,
      userId,
      input.savingsGoalId,
    ]
  );

  if (input.type === "DEBT_TAKEN") {
    await addObligation(client, "debts", entityId as number, input.amount, userId);
  }
  if (input.type === "RECEIVABLE_GIVEN") {
    await addObligation(client, "receivables", entityId as number, input.amount, userId);
  }
}
