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

  const userId = session.user.id;

  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      SELECT COALESCE(SUM(remaining_amount), 0) AS total
      FROM debts
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
    console.error("DEBT ERROR:", err);

    return NextResponse.json(
      { error: "Failed to fetch debt" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
