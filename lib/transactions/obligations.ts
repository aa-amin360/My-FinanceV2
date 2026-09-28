import type { DbClient } from "@/lib/db";

// Running per-counterparty totals for debts (money the user owes) and
// receivables (money owed to the user).
export type ObligationTable = "debts" | "receivables";

export async function addObligation(
  client: DbClient,
  table: ObligationTable,
  entityId: number,
  amount: number,
  userId: string
) {
  await client.query(
    `
    INSERT INTO ${table} (entity_id, total_amount, remaining_amount, user_id)
    VALUES ($1, $2, $2, $3)
    ON CONFLICT (entity_id, user_id)
    DO UPDATE SET
      total_amount = ${table}.total_amount + $2,
      remaining_amount = ${table}.remaining_amount + $2
    `,
    [entityId, amount, userId]
  );
}

// Reduce the remaining amount and drop the row once fully settled
export async function reduceObligation(
  client: DbClient,
  table: ObligationTable,
  entityId: number,
  amount: number,
  userId: string
) {
  await client.query(
    `UPDATE ${table}
     SET remaining_amount = remaining_amount - $2
     WHERE entity_id = $1 AND user_id = $3`,
    [entityId, amount, userId]
  );
  await client.query(
    `DELETE FROM ${table}
     WHERE entity_id = $1 AND user_id = $2 AND remaining_amount <= 0`,
    [entityId, userId]
  );
}

export async function clearObligation(client: DbClient, table: ObligationTable, entityId: number, userId: string) {
  await client.query(`DELETE FROM ${table} WHERE entity_id = $1 AND user_id = $2`, [entityId, userId]);
}

export async function getRemaining(
  client: DbClient,
  table: ObligationTable,
  entityId: number,
  userId: string
): Promise<number> {
  const res = await client.query(
    `SELECT remaining_amount FROM ${table} WHERE entity_id = $1 AND user_id = $2 FOR UPDATE`,
    [entityId, userId]
  );
  return Number(res.rows[0]?.remaining_amount || 0);
}
