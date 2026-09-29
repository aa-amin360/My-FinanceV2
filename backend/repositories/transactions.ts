import type { Db } from "@/backend/db/pool";
import { ledgerRowSql } from "@/shared/ledger";

export type NewTransaction = {
  type: string;
  amount: number;
  fromAccount: number | null;
  toAccount: number | null;
  entityId?: number | null;
  categoryId?: number | null;
  date: string;
  note: string | null;
  parentId?: number | null;
  savingsGoalId?: number | null;
  source?: string | null;
};

export async function insertTransaction(db: Db, userId: string, tx: NewTransaction): Promise<number> {
  const res = await db.query(
    `INSERT INTO transactions
     (type, amount, from_account, to_account, entity_id, category_id, date, note, parent_id, user_id, savings_goal_id, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id`,
    [
      tx.type,
      tx.amount,
      tx.fromAccount,
      tx.toAccount,
      tx.entityId ?? null,
      tx.categoryId ?? null,
      tx.date,
      tx.note,
      tx.parentId ?? null,
      userId,
      tx.savingsGoalId ?? null,
      tx.source ?? null,
    ]
  );
  return res.rows[0].id;
}

// ---------------------------------------------------------------------------
// Balances
// ---------------------------------------------------------------------------

export async function getAccountBalance(db: Db, accountId: number, userId: string): Promise<number> {
  const res = await db.query(
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

// Cash, Bank and Savings balances computed from the ledger
export async function getNamedBalances(db: Db, userId: string) {
  const res = await db.query(
    `
    SELECT
      COALESCE(SUM(CASE WHEN LOWER(TRIM(ta.name)) = 'cash' THEN t.amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN LOWER(TRIM(fa.name)) = 'cash' THEN t.amount ELSE 0 END), 0) AS cash_balance,

      COALESCE(SUM(CASE WHEN LOWER(TRIM(ta.name)) = 'bank' THEN t.amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN LOWER(TRIM(fa.name)) = 'bank' THEN t.amount ELSE 0 END), 0) AS bank_balance,

      COALESCE(SUM(CASE WHEN LOWER(TRIM(ta.name)) = 'savings' THEN t.amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN LOWER(TRIM(fa.name)) = 'savings' THEN t.amount ELSE 0 END), 0) AS savings_total
    FROM transactions t
    LEFT JOIN accounts fa ON t.from_account = fa.id
    LEFT JOIN accounts ta ON t.to_account = ta.id
    WHERE t.user_id = $1
      AND ${ledgerRowSql("t")}
    `,
    [userId]
  );
  return {
    cash: Number(res.rows[0]?.cash_balance || 0),
    bank: Number(res.rows[0]?.bank_balance || 0),
    savings: Number(res.rows[0]?.savings_total || 0),
  };
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

export type TransactionFilters = {
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  type?: string | null;
  entityId?: number | null;
};

const LIST_JOINS = `
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN entities e ON t.entity_id = e.id
  LEFT JOIN accounts fa ON t.from_account = fa.id
  LEFT JOIN accounts ta ON t.to_account = ta.id
`;

const LIST_COLUMNS = `
  t.id, t.type, t.amount, t.date, t.note, t.source,
  t.entity_id, t.category_id, t.parent_id, t.savings_goal_id,
  c.name AS category_name, e.name AS entity_name,
  fa.name AS from_account, ta.name AS to_account
`;

function buildRootFilter(userId: string, filters: TransactionFilters) {
  const conditions = ["t.user_id = $1", "t.parent_id IS NULL"];
  const params: unknown[] = [userId];
  const add = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (filters.search) {
    const p = add(`%${filters.search}%`);
    conditions.push(`(t.note ILIKE ${p} OR c.name ILIKE ${p} OR e.name ILIKE ${p})`);
  }
  if (filters.startDate) conditions.push(`t.date >= ${add(filters.startDate)}`);
  if (filters.endDate) conditions.push(`t.date <= ${add(filters.endDate)}`);
  if (filters.type) conditions.push(`t.type = ${add(filters.type)}`);
  if (filters.entityId) conditions.push(`t.entity_id = ${add(filters.entityId)}`);

  return { where: `WHERE ${conditions.join(" AND ")}`, params };
}

export async function countRootTransactions(db: Db, userId: string, filters: TransactionFilters): Promise<number> {
  const { where, params } = buildRootFilter(userId, filters);
  const res = await db.query(
    `SELECT COUNT(*) FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN entities e ON t.entity_id = e.id
     ${where}`,
    params
  );
  return parseInt(res.rows[0].count, 10);
}

// Top-level transactions, newest first
export async function listRootTransactions(
  db: Db,
  userId: string,
  filters: TransactionFilters,
  { limit, offset }: { limit: number; offset: number }
) {
  const { where, params } = buildRootFilter(userId, filters);
  params.push(limit, offset);
  const res = await db.query(
    `SELECT ${LIST_COLUMNS}
     FROM transactions t
     ${LIST_JOINS}
     ${where}
     ORDER BY t.date DESC, t.created_at DESC, t.id DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return res.rows;
}

export async function listChildTransactions(db: Db, userId: string, parentIds: number[]) {
  if (parentIds.length === 0) return [];
  const res = await db.query(
    `SELECT ${LIST_COLUMNS}
     FROM transactions t
     ${LIST_JOINS}
     WHERE t.user_id = $1 AND t.parent_id = ANY($2::int[])
     ORDER BY t.date ASC, t.created_at ASC, t.id ASC`,
    [userId, parentIds]
  );
  return res.rows;
}

// ---------------------------------------------------------------------------
// Parent/child lookups used by settlement and deletion
// ---------------------------------------------------------------------------

// The transaction a new repayment should hang under: the latest root that created
// the obligation, or an overpayment split parent whose remainder created it.
export async function findSettlementOrigin(
  db: Db,
  userId: string,
  entityId: number,
  originType: string,
  crossSplitType: string
): Promise<number | null> {
  const res = await db.query(
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
    [entityId, userId, originType, crossSplitType]
  );
  return res.rows[0]?.id ?? null;
}

export async function findTransactionForUpdate(db: Db, userId: string, id: number) {
  const res = await db.query(`SELECT * FROM transactions WHERE id = $1 AND user_id = $2 FOR UPDATE`, [id, userId]);
  return res.rows[0] ?? null;
}

export async function findTransactionType(db: Db, userId: string, id: number): Promise<string | null> {
  const res = await db.query(`SELECT type FROM transactions WHERE id = $1 AND user_id = $2`, [id, userId]);
  return res.rows[0]?.type ?? null;
}

export async function listChildTypes(db: Db, userId: string, parentId: number): Promise<string[]> {
  const res = await db.query(`SELECT type FROM transactions WHERE parent_id = $1 AND user_id = $2`, [parentId, userId]);
  return res.rows.map((row) => row.type);
}

export async function deleteChildren(db: Db, userId: string, parentId: number) {
  await db.query(`DELETE FROM transactions WHERE parent_id = $1 AND user_id = $2`, [parentId, userId]);
}

export async function deleteTransactionById(db: Db, userId: string, id: number) {
  await db.query(`DELETE FROM transactions WHERE id = $1 AND user_id = $2`, [id, userId]);
}

export async function deleteAllTransactions(db: Db, userId: string) {
  await db.query(`DELETE FROM transactions WHERE user_id = $1`, [userId]);
}

// Debt/receivable history for one counterparty in chronological order
export async function listEntityLedgerHistory(db: Db, userId: string, entityId: number) {
  const res = await db.query(
    `
    SELECT t.type, t.amount
    FROM transactions t
    WHERE t.entity_id = $1 AND t.user_id = $2
      AND ${ledgerRowSql("t")}
    ORDER BY t.date ASC, t.created_at ASC, t.id ASC
    `,
    [entityId, userId]
  );
  return res.rows as Array<{ type: string; amount: string }>;
}

// ---------------------------------------------------------------------------
// System-generated rows (opening balances)
// ---------------------------------------------------------------------------

export async function hasTransactionWithSource(db: Db, userId: string, source: string): Promise<boolean> {
  const res = await db.query("SELECT 1 FROM transactions WHERE user_id = $1 AND source = $2 LIMIT 1", [userId, source]);
  return res.rows.length > 0;
}

// Opening balance amounts with the account they were credited to
export async function listOpeningBalances(db: Db, userId: string, source: string) {
  const res = await db.query(
    `
    SELECT t.amount, a.name AS account_name
    FROM transactions t
    JOIN accounts a ON t.to_account = a.id
    WHERE t.user_id = $1 AND t.source = $2
    `,
    [userId, source]
  );
  return res.rows as Array<{ amount: string; account_name: string }>;
}

// ---------------------------------------------------------------------------
// Savings goal links
// ---------------------------------------------------------------------------

export async function deleteGoalTransactions(db: Db, userId: string, goalId: number) {
  await db.query("DELETE FROM transactions WHERE savings_goal_id = $1 AND user_id = $2", [goalId, userId]);
}

export async function detachGoalTransactions(db: Db, userId: string, goalId: number) {
  await db.query("UPDATE transactions SET savings_goal_id = NULL WHERE savings_goal_id = $1 AND user_id = $2", [
    goalId,
    userId,
  ]);
}

// Net amount moved into the Savings account for a goal
export async function getGoalSavedAmount(db: Db, userId: string, goalId: number, savingsAccountId: number | null) {
  const res = await db.query(
    `
    SELECT COALESCE(SUM(
      CASE
        WHEN t.to_account = $1 THEN t.amount
        WHEN t.from_account = $1 THEN -t.amount
        ELSE 0
      END
    ), 0) AS total_saved
    FROM transactions t
    WHERE t.savings_goal_id = $2 AND t.user_id = $3
    `,
    [savingsAccountId, goalId, userId]
  );
  return Number(res.rows[0]?.total_saved || 0);
}
