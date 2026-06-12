export const runtime = "nodejs";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ==========================================
// GET BUDGET PLANS (FILTERED BY MONTH/YEAR)
// ==========================================
export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.email;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  if (!month || !year) {
    return NextResponse.json(
      { error: "Month and Year parameters are required." },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    // Fetch plans filtered by month and year, keeping performance highly optimal
    const result = await client.query(
      `
      SELECT id, type, amount, target_id, target_name, date, note, status
      FROM budget_plans
      WHERE user_id = $1
        AND EXTRACT(MONTH FROM date) = $2
        AND EXTRACT(YEAR FROM date) = $3
      ORDER BY date ASC, created_at ASC
      `,
      [userId, Number(month), Number(year)]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });

  } catch (err: any) {
    console.error("GET BUDGET PLANS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch budget plans." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// ==========================================
// CREATE A NEW BUDGET PLAN
// ==========================================
export async function POST(req: Request) {
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
    const body = await req.json();
    const { type, amount, target_id, target_name, date, note } = body;

    // Validation
    if (!type || !amount || !target_name || !date) {
      return NextResponse.json(
        { error: "Missing required fields: type, amount, target_name, and date are required." },
        { status: 400 }
      );
    }

    const result = await client.query(
      `
      INSERT INTO budget_plans (type, amount, target_id, target_name, date, note, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [type, Number(amount), target_id || null, target_name, date, note || null, userId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });

  } catch (err: any) {
    console.error("CREATE BUDGET PLAN ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create budget plan." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}