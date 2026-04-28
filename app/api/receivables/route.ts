export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  const session = await getServerSession(authOptions);

  // 🔐 AUTH CHECK
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.email;

  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      SELECT COALESCE(SUM(remaining_amount), 0) AS total
      FROM receivables
      WHERE user_id = $1
      `,
      [userId]
    );

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
