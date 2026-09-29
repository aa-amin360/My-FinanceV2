import type { Db } from "@/backend/db/pool";
import { ledgerRowSql } from "@/shared/ledger";

// Aggregate queries for the dashboard and reports. `startDate` null means "all time".

export async function getIncomeExpenseTotals(db: Db, userId: string, startDate: string | null, endDate: string) {
  const res = await db.query(
    `
    SELECT
      COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS expense
    FROM transactions
    WHERE user_id = $1
      AND ($2::date IS NULL OR date >= $2::date)
      AND date <= $3::date
    `,
    [userId, startDate, endDate]
  );
  return {
    income: Number(res.rows[0]?.income || 0),
    expense: Number(res.rows[0]?.expense || 0),
  };
}

export async function getExpenseByCategory(db: Db, userId: string, startDate: string | null, endDate: string) {
  const res = await db.query(
    `
    SELECT COALESCE(c.name, 'Other') AS name, SUM(t.amount) AS value
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = $1
      AND t.type = 'EXPENSE'
      AND ($2::date IS NULL OR t.date >= $2::date)
      AND t.date <= $3::date
    GROUP BY COALESCE(c.name, 'Other')
    ORDER BY value DESC
    `,
    [userId, startDate, endDate]
  );
  return res.rows.map((row) => ({ name: String(row.name), value: Number(row.value) }));
}

// Cash + Bank balance at the end of each day that had activity. The running sum
// covers the full history so the first point in a range starts from the correct
// balance rather than zero.
export async function getBalanceTrajectory(db: Db, userId: string, startDate: string | null, endDate: string) {
  const res = await db.query(
    `
    WITH liquid AS (
      SELECT id FROM accounts
      WHERE user_id = $1 AND LOWER(TRIM(name)) IN ('cash', 'bank')
    ),
    daily AS (
      SELECT
        t.date,
        SUM(CASE WHEN t.to_account IN (SELECT id FROM liquid) THEN t.amount ELSE 0 END)
          - SUM(CASE WHEN t.from_account IN (SELECT id FROM liquid) THEN t.amount ELSE 0 END) AS delta
      FROM transactions t
      WHERE t.user_id = $1
        AND ${ledgerRowSql("t")}
      GROUP BY t.date
    ),
    running AS (
      SELECT date, SUM(delta) OVER (ORDER BY date) AS balance FROM daily
    )
    SELECT date, balance FROM running
    WHERE ($2::date IS NULL OR date >= $2::date) AND date <= $3::date
    ORDER BY date
    `,
    [userId, startDate, endDate]
  );
  return res.rows.map((row) => ({ date: String(row.date), balance: Number(row.balance) }));
}

// Expense totals per day between two dates (inclusive)
export async function getDailyExpenses(db: Db, userId: string, startDate: string, endDate: string) {
  const res = await db.query(
    `
    SELECT date, SUM(amount) AS amount
    FROM transactions
    WHERE user_id = $1
      AND type = 'EXPENSE'
      AND date BETWEEN $2 AND $3
    GROUP BY date
    `,
    [userId, startDate, endDate]
  );
  return new Map<string, number>(res.rows.map((row) => [String(row.date), Number(row.amount)]));
}
