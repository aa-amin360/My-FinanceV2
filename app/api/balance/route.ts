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
        a.name,
        COALESCE(SUM(
          CASE 
            WHEN t.to_account = a.id THEN t.amount
            WHEN t.from_account = a.id THEN -t.amount
            ELSE 0
          END
        ), 0) AS balance
      FROM accounts a
      LEFT JOIN transactions t
        ON t.from_account = a.id OR t.to_account = a.id
      WHERE a.name IN ('Cash', 'Bank')
      GROUP BY a.id
    `);

    const total = result.rows.reduce(
      (sum, row) => sum + Number(row.balance),
      0
    );

    return NextResponse.json({
      success: true,
      total,
      breakdown: result.rows,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
