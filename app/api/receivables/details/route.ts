export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
      SELECT 
        r.entity_id,
        e.name,
        r.total_amount,
        r.remaining_amount
      FROM receivables r
      JOIN entities e 
        ON r.entity_id = e.id
      WHERE r.user_id = $1
      `,
      [userId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });

  } catch (err: any) {
    console.error("RECEIVABLE DETAILS ERROR:", err);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
