import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT
        TO_CHAR(date, 'Dy') AS day,
        COALESCE(SUM(amount), 0) AS amount
      FROM transactions
      WHERE type = 'EXPENSE'
        AND date >= NOW() - INTERVAL '6 days'
      GROUP BY day, EXTRACT(DOW FROM date)
      ORDER BY EXTRACT(DOW FROM date)
    `);

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const mapped = days.map((day) => {
      const found = result.rows.find(
        (r) => r.day.trim() === day
      );

      return {
        day,
        amount: Number(found?.amount || 0),
      };
    });

    return NextResponse.json({
      success: true,
      data: mapped,
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
