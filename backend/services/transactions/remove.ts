import type { Db } from "@/backend/db/pool";
import { AppError } from "@/backend/http/AppError";
import { addObligation, clearAllObligations, clearObligation, reduceObligation } from "@/backend/repositories/obligations";
import {
  deleteAllTransactions,
  deleteChildren,
  deleteTransactionById,
  findTransactionForUpdate,
  findTransactionType,
  listChildTypes,
  listEntityLedgerHistory,
} from "@/backend/repositories/transactions";
import { setHistoryInitialized } from "@/backend/repositories/users";
import { isUserLinkedChild } from "@/shared/ledger";

// Recompute an entity's debt/receivable totals from its remaining history
export async function rebuildEntityState(db: Db, userId: string, entityId: number) {
  await clearObligation(db, "debts", entityId, userId);
  await clearObligation(db, "receivables", entityId, userId);

  for (const row of await listEntityLedgerHistory(db, userId, entityId)) {
    const amount = Number(row.amount);
    if (row.type === "DEBT_TAKEN") await addObligation(db, "debts", entityId, amount, userId);
    if (row.type === "DEBT_REPAID") await reduceObligation(db, "debts", entityId, amount, userId);
    if (row.type === "RECEIVABLE_GIVEN") await addObligation(db, "receivables", entityId, amount, userId);
    if (row.type === "RECEIVABLE_RECEIVED") await reduceObligation(db, "receivables", entityId, amount, userId);
  }
}

// Delete a transaction and anything that only exists because of it.
//
// - Auto-generated split children cannot be deleted on their own; delete the parent.
// - Repayments linked to an earlier obligation can be deleted individually.
// - A transaction with linked repayments cannot be deleted until those are removed.
export async function deleteTransaction(db: Db, userId: string, id: number) {
  const tx = await findTransactionForUpdate(db, userId, id);
  if (!tx) {
    throw new AppError("Transaction not found.", 404);
  }

  if (tx.parent_id) {
    const parentType = await findTransactionType(db, userId, tx.parent_id);
    if (!parentType || !isUserLinkedChild(tx.type, parentType)) {
      throw new AppError("This entry was generated automatically. Delete the transaction it belongs to instead.");
    }
  } else {
    const childTypes = await listChildTypes(db, userId, tx.id);
    if (childTypes.some((childType) => isUserLinkedChild(childType, tx.type))) {
      throw new AppError("Delete the repayments recorded against this transaction first.");
    }
    await deleteChildren(db, userId, tx.id);
  }

  await deleteTransactionById(db, userId, tx.id);

  if (tx.entity_id) {
    await rebuildEntityState(db, userId, tx.entity_id);
  }
}

// Remove every transaction and the debt/receivable totals derived from them.
// Savings goals, budget plans and categories are kept. Opening balances go too,
// so the user is sent through onboarding again.
export async function resetLedger(db: Db, userId: string) {
  await deleteAllTransactions(db, userId);
  await clearAllObligations(db, userId);
  await setHistoryInitialized(db, userId, false);
}
