import type { DbClient } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { isUserLinkedChild, ledgerRowSql } from "@/lib/ledger";
import { addObligation, reduceObligation } from "@/lib/transactions/obligations";

// Recompute an entity's debt/receivable totals from its remaining history
export async function rebuildEntityState(client: DbClient, userId: string, entityId: number) {
  await client.query(`DELETE FROM debts WHERE entity_id = $1 AND user_id = $2`, [entityId, userId]);
  await client.query(`DELETE FROM receivables WHERE entity_id = $1 AND user_id = $2`, [entityId, userId]);

  const history = await client.query(
    `
    SELECT t.type, t.amount
    FROM transactions t
    WHERE t.entity_id = $1 AND t.user_id = $2
      AND ${ledgerRowSql("t")}
    ORDER BY t.date ASC, t.created_at ASC, t.id ASC
    `,
    [entityId, userId]
  );

  for (const row of history.rows) {
    const amount = Number(row.amount);
    if (row.type === "DEBT_TAKEN") await addObligation(client, "debts", entityId, amount, userId);
    if (row.type === "DEBT_REPAID") await reduceObligation(client, "debts", entityId, amount, userId);
    if (row.type === "RECEIVABLE_GIVEN") await addObligation(client, "receivables", entityId, amount, userId);
    if (row.type === "RECEIVABLE_RECEIVED") await reduceObligation(client, "receivables", entityId, amount, userId);
  }
}

// Delete a transaction and anything that only exists because of it.
//
// - Auto-generated split children cannot be deleted on their own; delete the parent.
// - Repayments linked to an earlier obligation can be deleted individually.
// - A transaction with linked repayments cannot be deleted until those are removed.
export async function deleteTransaction(client: DbClient, userId: string, id: number) {
  const txRes = await client.query(`SELECT * FROM transactions WHERE id = $1 AND user_id = $2 FOR UPDATE`, [
    id,
    userId,
  ]);
  if (txRes.rows.length === 0) {
    throw new AppError("Transaction not found.", 404);
  }
  const tx = txRes.rows[0];

  if (tx.parent_id) {
    const parentRes = await client.query(`SELECT type FROM transactions WHERE id = $1 AND user_id = $2`, [
      tx.parent_id,
      userId,
    ]);
    const parentType = parentRes.rows[0]?.type;
    if (!parentType || !isUserLinkedChild(tx.type, parentType)) {
      throw new AppError("This entry was generated automatically. Delete the transaction it belongs to instead.");
    }
  } else {
    const childrenRes = await client.query(`SELECT type FROM transactions WHERE parent_id = $1 AND user_id = $2`, [
      tx.id,
      userId,
    ]);
    const hasLinkedRepayments = childrenRes.rows.some((child) => isUserLinkedChild(child.type, tx.type));
    if (hasLinkedRepayments) {
      throw new AppError("Delete the repayments recorded against this transaction first.");
    }

    await client.query(`DELETE FROM transactions WHERE parent_id = $1 AND user_id = $2`, [tx.id, userId]);
  }

  await client.query(`DELETE FROM transactions WHERE id = $1 AND user_id = $2`, [tx.id, userId]);

  if (tx.entity_id) {
    await rebuildEntityState(client, userId, tx.entity_id);
  }
}
