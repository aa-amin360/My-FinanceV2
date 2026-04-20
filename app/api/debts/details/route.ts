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
        t.entity,
        SUM(CASE WHEN t.type = 'DEBT_TAKEN' THEN t.amount ELSE 0 END) AS total,
        SUM(CASE WHEN t.type = 'DEBT_TAKEN' THEN t.amount ELSE 0 END) -
        SUM(CASE WHEN t.type = 'DEBT_REPAID' THEN t.amount ELSE 0 END) AS remaining
      FROM transactions t
      WHERE t.type IN ('DEBT_TAKEN', 'DEBT_REPAID')
        AND t.entity IS NOT NULL
      GROUP BY t.entity
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
