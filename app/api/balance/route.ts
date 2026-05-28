export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

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
        t.amount,
        fa.name AS from_account,
        ta.name AS to_account
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account = fa.id
      LEFT JOIN accounts ta ON t.to_account = ta.id
      WHERE t.user_id = $1
      AND t.parent_id IS NULL
      `,
      [userId]
    );

    let balance = 0;
    let cashBalance = 0;
    let bankBalance = 0;

    for (const row of result.rows) {
      const amount = Number(row.amount) || 0;

      const from = row.from_account
        ? row.from_account.toLowerCase().trim()
        : null;

      const to = row.to_account
        ? row.to_account.toLowerCase().trim()
        : null;

      // =========================
      // CASH
      // =========================
      if (to === "cash") {
        cashBalance += amount;
        balance += amount;
      }

      if (from === "cash") {
        cashBalance -= amount;
        balance -= amount;
      }

      // =========================
      // BANK
      // =========================
      if (to === "bank") {
        bankBalance += amount;
        balance += amount;
      }

      if (from === "bank") {
        bankBalance -= amount;
        balance -= amount;
      }
    }

    return NextResponse.json({
      success: true,
      balance,
      cashBalance,
      bankBalance,
    });

  } catch (err: any) {
    console.error("BALANCE ERROR:", err);

    return NextResponse.json(
      { error: "Balance calculation failed" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
