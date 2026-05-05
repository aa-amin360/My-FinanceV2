import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
    // 🔥 Last 7 days transaction flow
    const result = await client.query(
      `
      SELECT
        DATE(date) as full_date,
        type,
        amount
      FROM transactions
      WHERE user_id = $1
        AND date >= NOW() - INTERVAL '6 days'
      ORDER BY date ASC
      `,
      [userId]
    );

    const daysMap: Record<string, number> = {
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };

    for (const tx of result.rows) {
      const day = new Date(tx.full_date).toLocaleDateString("en-US", {
        weekday: "short",
      });

      const amount = Number(tx.amount);

      // 🔥 Positive flow
      const positive =
        tx.type === "INCOME" ||
        tx.type === "DEBT_TAKEN" ||
        tx.type === "RECEIVABLE_RECEIVED";

      daysMap[day] += positive ? amount : -amount;
    }

    const ordered = [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ];

    const data = ordered.map((day) => ({
      day,
      amount: Math.abs(daysMap[day] || 0),
    }));

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
