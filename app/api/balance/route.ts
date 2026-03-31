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
        LOWER(fa.name) AS from_account,
        LOWER(ta.name) AS to_account
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account_account_id = fa.id
      LEFT JOIN accounts ta ON t.to_account_account_id = ta.id
    `);

    let balance = 0;

    for (const row of result.rows) {
      const amount = Number(row.amount);

      const from = row.from_account?.trim();
      const to = row.to_account?.trim();

      // INCOMING
      if (to === "cash" || to === "bank") {
        balance += amount;
      }

      // OUTGOING
      if (from === "cash" || from === "bank") {
        balance -= amount;
      }
    }

    return NextResponse.json({
      success: true,
      total: balance,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Balance error" }, { status: 500 });
  } finally {
    client.release();
  }
}
