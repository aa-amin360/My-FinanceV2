export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { errorResponse, requireUserId } from "@/lib/api";
import { dateOrToday } from "@/lib/validation";

const WEEK_DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

// Expenses per day for the current Saturday-to-Friday week.
// The client passes its local date as ?today=YYYY-MM-DD so the week matches the
// user's calendar rather than the server's timezone.
export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const today = new Date(`${dateOrToday(new URL(req.url).searchParams.get("today"))}T00:00:00Z`);

    const diffToSaturday = (today.getUTCDay() + 1) % 7;
    const startOfWeek = addDays(today, -diffToSaturday);
    const endOfWeek = addDays(startOfWeek, 6);

    const result = await pool.query(
      `
      SELECT date, SUM(amount) AS amount
      FROM transactions
      WHERE user_id = $1
        AND type = 'EXPENSE'
        AND date BETWEEN $2 AND $3
      GROUP BY date
      `,
      [userId, startOfWeek.toISOString().slice(0, 10), endOfWeek.toISOString().slice(0, 10)]
    );

    const totals = new Map<string, number>(result.rows.map((row) => [row.date, Number(row.amount)]));

    const data = WEEK_DAYS.map((day, index) => ({
      day,
      amount: totals.get(addDays(startOfWeek, index).toISOString().slice(0, 10)) || 0,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err, "WEEKLY EXPENSES ERROR");
  }
}
