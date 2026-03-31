export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT 
        t.amount,
        fa.name AS from_account,
        ta.name AS to_account
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account = fa.id
      LEFT JOIN accounts ta ON t.to_account = ta.id
    `);

    let balance = 0;

    for (const row of result.rows) {
      const amount = Number(row.amount) || 0;

      // normalize safely
      const from = row.from_account
        ? row.from_account.toLowerCase().trim()
        : null;

      const to = row.to_account
        ? row.to_account.toLowerCase().trim()
        : null;

      // =========================
      // CORE LOGIC
      // =========================

      // Money comes INTO wallet
      if (to === "cash" || to === "bank") {
        balance += amount;
      }

      // Money goes OUT of wallet
      if (from === "cash" || from === "bank") {
        balance -= amount;
      }
    }

    return NextResponse.json({
      success: true,
      total: balance,
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
