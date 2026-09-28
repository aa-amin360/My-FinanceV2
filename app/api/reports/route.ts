export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { errorResponse, requireUserId } from "@/lib/api";
import { ledgerRowSql } from "@/lib/ledger";
import { dateOrToday, parseEnum } from "@/lib/validation";

const RANGES = ["ALL", "YEAR", "MONTH"] as const;

// Summary figures for the dashboard and reports pages, computed over the whole
// ledger in SQL rather than from a paginated page of transactions.
//
// ?range=ALL|YEAR|MONTH  period for income/expense/categories/trajectory
// ?today=YYYY-MM-DD      the user's local date, used to anchor YEAR/MONTH
export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const range = parseEnum(searchParams.get("range") || "ALL", RANGES, "Range");
    const today = dateOrToday(searchParams.get("today"));

    const startDate =
      range === "MONTH" ? `${today.slice(0, 7)}-01` : range === "YEAR" ? `${today.slice(0, 4)}-01-01` : null;

    const totalsRes = await pool.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS expense
      FROM transactions
      WHERE user_id = $1
        AND ($2::date IS NULL OR date >= $2::date)
        AND date <= $3::date
      `,
      [userId, startDate, today]
    );

    const categoriesRes = await pool.query(
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
      [userId, startDate, today]
    );

    // Cash + Bank balance at the end of each day that had activity. The running
    // sum covers the full history so the first point in a range starts from the
    // correct balance rather than zero.
    const trajectoryRes = await pool.query(
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
      [userId, startDate, today]
    );

    const income = Number(totalsRes.rows[0]?.income || 0);
    const expense = Number(totalsRes.rows[0]?.expense || 0);

    return NextResponse.json({
      success: true,
      range,
      income,
      expense,
      categories: categoriesRes.rows.map((row) => ({ name: row.name, value: Number(row.value) })),
      trajectory: trajectoryRes.rows.map((row) => ({ date: row.date, balance: Number(row.balance) })),
    });
  } catch (err) {
    return errorResponse(err, "REPORTS ERROR");
  }
}
