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
      SELECT 
        d.entity_id,
        e.name,
        d.total_amount,
        d.remaining_amount
      FROM debts d
      JOIN entities e 
        ON d.entity_id = e.id
      WHERE d.user_id = $1
      `,
      [userId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });

  } catch (err: any) {
    console.error("DEBT DETAILS ERROR:", err);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
