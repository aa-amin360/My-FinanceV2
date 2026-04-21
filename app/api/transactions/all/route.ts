export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function DELETE() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // clear all related tables first
    await client.query(`DELETE FROM transactions`);
    await client.query(`DELETE FROM debts`);
    await client.query(`DELETE FROM receivables`);

    await client.query("COMMIT");

    return NextResponse.json({ success: true });

  } catch (err: any) {
    await client.query("ROLLBACK");

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
