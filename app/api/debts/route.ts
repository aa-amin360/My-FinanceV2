export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
        SUM(CASE WHEN type = 'DEBT_TAKEN' THEN amount ELSE 0 END) -
        SUM(CASE WHEN type = 'DEBT_REPAID' THEN amount ELSE 0 END) AS total
      FROM transactions
      WHERE type IN ('DEBT_TAKEN', 'DEBT_REPAID')
    `);

    const total = Number(result.rows[0]?.total) || 0;

    return NextResponse.json({
      success: true,
      total,
    });

  } catch (err: any) {
    console.error("DEBT ERROR:", err);

    return NextResponse.json(
      { error: "Failed to fetch debt" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
