export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { errorResponse, requireUserId } from "@/lib/api";
import { ledgerRowSql } from "@/lib/ledger";

export async function GET() {
  try {
    const userId = await requireUserId();

    // Compute cash, bank, and savings balances from the ledger
    const result = await pool.query(
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

    // Postgres NUMERIC arithmetic is exact; convert once at the end
    const cashBalance = Number(result.rows[0]?.cash_balance || 0);
    const bankBalance = Number(result.rows[0]?.bank_balance || 0);
    const savingsTotal = Number(result.rows[0]?.savings_total || 0);
    const balance = Math.round((cashBalance + bankBalance) * 100) / 100;

    return NextResponse.json({ success: true, balance, cashBalance, bankBalance, savingsTotal });
  } catch (err) {
    return errorResponse(err, "BALANCE ERROR");
  }
}
