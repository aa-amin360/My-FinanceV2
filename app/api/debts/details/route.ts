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
        e.name,
        SUM(CASE WHEN t.type = 'DEBT_TAKEN' THEN t.amount ELSE 0 END) AS total,
        SUM(CASE WHEN t.type = 'DEBT_TAKEN' THEN t.amount ELSE 0 END) -
        SUM(CASE WHEN t.type = 'DEBT_REPAID' THEN t.amount ELSE 0 END) AS remaining
      FROM transactions t
      JOIN entities e ON t.entity_id = e.id
      WHERE t.type IN ('DEBT_TAKEN', 'DEBT_REPAID')
      GROUP BY e.name
    `);

    const debts = result.rows.filter(d => Number(d.remaining) > 0);

    return NextResponse.json({
      success: true,
      data: debts,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  } finally {
    client.release();
  }
}
