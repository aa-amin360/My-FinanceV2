import type { DbClient } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { ledgerRowSql } from "@/lib/ledger";
import { TYPE_META, TxType } from "@/lib/transactions/types";

export async function getAccountBalance(client: DbClient, accountId: number, userId: string): Promise<number> {
  const res = await client.query(
    `
    SELECT COALESCE(SUM(
      CASE
        WHEN t.to_account = $1 THEN t.amount
        WHEN t.from_account = $1 THEN -t.amount
        ELSE 0
      END
    ), 0) AS balance
    FROM transactions t
    WHERE t.user_id = $2
      AND (t.to_account = $1 OR t.from_account = $1)
      AND ${ledgerRowSql("t")}
    `,
    [accountId, userId]
  );
  return Number(res.rows[0].balance || 0);
}

// Reject outflows larger than the source account's balance
export async function checkBalance(
  client: DbClient,
  accountId: number,
  userId: string,
  type: TxType,
  amount: number
) {
  const flowType = TYPE_META[type].flow;
  if (flowType !== "OUT" && flowType !== "MOVE") return;

  // Serialise concurrent withdrawals from the same account
  await client.query(`SELECT id FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE`, [
    accountId,
    userId,
  ]);

  const balance = await getAccountBalance(client, accountId, userId);
  if (amount > balance) {
    throw new AppError("Insufficient balance in source account.");
  }
}
