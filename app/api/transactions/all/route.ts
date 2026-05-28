export const runtime = "nodejs";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE() {
  const session = await getServerSession(authOptions);

  // 🔐 AUTH GUARD
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.email;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // =========================
    // USER-SCOPED CLEANUP
    // =========================

    await client.query(
      `DELETE FROM transactions WHERE user_id = $1`,
      [userId]
    );

    await client.query(
      `DELETE FROM debts WHERE user_id = $1`,
      [userId]
    );

    await client.query(
      `DELETE FROM receivables WHERE user_id = $1`,
      [userId]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "User ledger reset successfully",
    });

  } catch (err: any) {
    await client.query("ROLLBACK");

    console.error("DELETE ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Delete failed" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
