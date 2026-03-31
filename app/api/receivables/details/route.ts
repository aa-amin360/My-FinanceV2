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
        r.entity_id,
        e.name,
        r.total_amount,
        r.remaining_amount
      FROM receivables r
      JOIN entities e ON r.entity_id = e.id
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  } finally {
    client.release();
  }
}
