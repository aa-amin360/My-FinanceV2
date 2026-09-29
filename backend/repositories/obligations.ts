import type { Db } from "@/backend/db/pool";

// Running per-counterparty totals for debts (money the user owes) and
// receivables (money owed to the user).
export type ObligationTable = "debts" | "receivables";

export async function addObligation(db: Db, table: ObligationTable, entityId: number, amount: number, userId: string) {
  await db.query(
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
export async function reduceObligation(db: Db, table: ObligationTable, entityId: number, amount: number, userId: string) {
  await db.query(
    `UPDATE ${table}
     SET remaining_amount = remaining_amount - $2
     WHERE entity_id = $1 AND user_id = $3`,
    [entityId, amount, userId]
  );
  await db.query(
    `DELETE FROM ${table}
     WHERE entity_id = $1 AND user_id = $2 AND remaining_amount <= 0`,
    [entityId, userId]
  );
}

export async function clearObligation(db: Db, table: ObligationTable, entityId: number, userId: string) {
  await db.query(`DELETE FROM ${table} WHERE entity_id = $1 AND user_id = $2`, [entityId, userId]);
}

export async function clearAllObligations(db: Db, userId: string) {
  await db.query(`DELETE FROM debts WHERE user_id = $1`, [userId]);
  await db.query(`DELETE FROM receivables WHERE user_id = $1`, [userId]);
}

// Remaining amount, locking the row for the rest of the transaction
export async function getRemainingForUpdate(db: Db, table: ObligationTable, entityId: number, userId: string): Promise<number> {
  const res = await db.query(
    `SELECT remaining_amount FROM ${table} WHERE entity_id = $1 AND user_id = $2 FOR UPDATE`,
    [entityId, userId]
  );
  return Number(res.rows[0]?.remaining_amount || 0);
}

export async function getTotalRemaining(db: Db, table: ObligationTable, userId: string): Promise<number> {
  const res = await db.query(
    `SELECT COALESCE(SUM(remaining_amount), 0) AS total FROM ${table} WHERE user_id = $1`,
    [userId]
  );
  return Number(res.rows[0]?.total) || 0;
}

export async function listObligations(db: Db, table: ObligationTable, userId: string) {
  const res = await db.query(
    `
    SELECT o.entity_id, e.name, o.total_amount, o.remaining_amount
    FROM ${table} o
    JOIN entities e ON o.entity_id = e.id
    WHERE o.user_id = $1
    ORDER BY o.remaining_amount DESC
    `,
    [userId]
  );
  return res.rows;
}
