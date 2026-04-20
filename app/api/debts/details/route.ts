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
        d.entity_id,
        e.name,
        d.total_amount,
        d.remaining_amount
      FROM debts d
      JOIN entities e ON d.entity_id = e.id
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
