import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.email;
  const client = await pool.connect();

  try {
    // ==========================================
    // CALENDAR WEEK BOUNDS (Saturday to Friday)
    // ==========================================
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate days since the most recent Saturday
    const diffToSaturday = (dayOfWeek + 1) % 7;

    // Start of the week is Saturday 00:00:00
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - diffToSaturday);
    startOfWeek.setHours(0, 0, 0, 0);

    // End of the week is Friday 23:59:59
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startDateStr = startOfWeek.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const endDateStr = endOfWeek.toLocaleDateString("en-CA");     // YYYY-MM-DD

    // Query transactions strictly bounded within Saturday to Friday of the CURRENT week
    const result = await client.query(
      `
      SELECT
        DATE(date) as full_date,
        type,
        amount
      FROM transactions
      WHERE user_id = $1
        AND date >= $2
        AND date <= $3
      ORDER BY date ASC
      `,
      [userId, startDateStr, endDateStr]
    );

    // Initialize days in the Saturday-Friday order
    const daysMap: Record<string, number> = {
      Sat: 0,
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
    };

    for (const tx of result.rows) {
      const day = new Date(tx.full_date).toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC"
      });
    
      const amount = Number(tx.amount);
    
      if (tx.type === "EXPENSE") {
        if (daysMap[day] !== undefined) {
          daysMap[day] += amount;
        }
      }
    }

    // Map ordered weeks starting from Saturday
    const ordered = [
      "Sat",
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
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