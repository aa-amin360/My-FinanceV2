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
      LEFT JOIN accounts fa ON t.from_account_id = fa.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
    `);

    let balance = 0;

    for (const row of result.rows) {
      const amount = Number(row.amount);

      // Money coming INTO cash/bank
      if (row.to_account === "Cash" || row.to_account === "Bank") {
        balance += amount;
      }

      // Money going OUT of cash/bank
      if (row.from_account === "Cash" || row.from_account === "Bank") {
        balance -= amount;
      }
    }

    return NextResponse.json({
      success: true,
      total: balance,
    });

  } catch (err) {
    return NextResponse.json({ error: "Balance error" }, { status: 500 });
  } finally {
    client.release();
  }
}
