export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.email;
  const client = await pool.connect();

  try {
    // Compute cash and bank balances dynamically from active ledger states
    const result = await client.query(
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
      -- ... keep the existing parent_id filters exactly the same ...
      `,
      [userId]
    );

    const cashBalance = Number(result.rows[0]?.cash_balance || 0);
    const bankBalance = Number(result.rows[0]?.bank_balance || 0);
    const savingsTotal = Number(result.rows[0]?.savings_total || 0);
    const balance = cashBalance + bankBalance;

    return NextResponse.json({
      success: true,
      balance,
      cashBalance,
      bankBalance,
      savingsTotal,
    });

  } catch (err: any) {
    console.error("BALANCE ERROR:", err);

    return NextResponse.json(
      { error: "Balance calculation failed" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
