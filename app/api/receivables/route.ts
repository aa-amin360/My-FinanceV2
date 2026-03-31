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
      SELECT COALESCE(SUM(remaining_amount), 0) AS total
      FROM receivables
    `);

    const total = Number(result.rows[0]?.total) || 0;

    return NextResponse.json({
      success: true,
      total,
    });

  } catch (err: any) {
    console.error("RECEIVABLE ERROR:", err);

    return NextResponse.json(
      { error: "Failed to fetch receivable" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
