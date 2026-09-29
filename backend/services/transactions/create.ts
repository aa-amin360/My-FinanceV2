import type { Db } from "@/backend/db/pool";
import { resolveAccounts } from "@/backend/repositories/accounts";
import { getEntityId } from "@/backend/repositories/entities";
import { addObligation } from "@/backend/repositories/obligations";
import { insertTransaction } from "@/backend/repositories/transactions";
import { assertCategoryMatches, assertGoalOwned } from "@/backend/services/ownership";
import { assertSufficientBalance } from "@/backend/services/transactions/balanceGuard";
import { buildFlow } from "@/backend/services/transactions/flow";
import { settleObligation } from "@/backend/services/transactions/settlement";
import type { CreateTransactionInput } from "@/backend/validators/transactions";
import { TYPE_META, TxType } from "@/shared/transactionTypes";

// Counterparties are stored as liabilities for debts and assets for receivables
async function resolveEntity(db: Db, name: string | null, type: TxType, userId: string) {
  if (!name) return null;
  const { group } = TYPE_META[type];
  if (group === "DEBT") return getEntityId(db, name, "LIABILITY", userId);
  if (group === "RECEIVABLE") return getEntityId(db, name, "ASSET", userId);
  return null;
}

// Record a transaction and keep debt/receivable totals in sync.
// Must run inside a database transaction (see withTransaction).
export async function createTransaction(db: Db, userId: string, input: CreateTransactionInput) {
  await assertCategoryMatches(db, userId, input.categoryId, input.type);
  await assertGoalOwned(db, userId, input.savingsGoalId);

  const ids = await resolveAccounts(db, input.account, userId);
  const entityId = await resolveEntity(db, input.entity, input.type, userId);
  const flow = buildFlow(input.type, input.direction, ids, entityId);

  const sourceAccount =
    input.type === "TRANSFER" && input.direction === "FROM_SAVINGS" ? ids.savingsId : ids.accountId;
  await assertSufficientBalance(db, sourceAccount, userId, input.type, input.amount);

  if (input.type === "DEBT_REPAID" || input.type === "RECEIVABLE_RECEIVED") {
    await settleObligation({
      db,
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

  await insertTransaction(db, userId, {
    type: input.type,
    amount: input.amount,
    fromAccount: flow.from_account,
    toAccount: flow.to_account,
    entityId,
    categoryId: input.categoryId,
    date: input.date,
    note: input.note,
    savingsGoalId: input.savingsGoalId,
  });

  if (input.type === "DEBT_TAKEN") {
    await addObligation(db, "debts", entityId as number, input.amount, userId);
  }
  if (input.type === "RECEIVABLE_GIVEN") {
    await addObligation(db, "receivables", entityId as number, input.amount, userId);
  }
}
