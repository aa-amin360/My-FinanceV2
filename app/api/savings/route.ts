import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { errorResponse, readJson, requireUserId } from "@/lib/api";
import { parseGoalInput } from "@/lib/savings";

// ==========================================
// GET ALL SAVINGS GOALS (PROGRESS CALCULATED FROM THE LEDGER)
// ==========================================
export async function GET() {
  try {
    const userId = await requireUserId();

    const res = await pool.query(
      `
      WITH savings_account AS (
        SELECT id FROM accounts
        WHERE LOWER(TRIM(name)) = 'savings' AND user_id = $1
        ORDER BY id
        LIMIT 1
      )
      SELECT
        sg.id,
        sg.name,
        sg.target_amount,
        sg.target_date,
        sg.installment_amount,
        sg.frequency,
        sg.reminder_day,
        sg.created_at,
        COALESCE(SUM(
          CASE
            WHEN t.to_account = (SELECT id FROM savings_account) THEN t.amount
            WHEN t.from_account = (SELECT id FROM savings_account) THEN -t.amount
            ELSE 0
          END
        ), 0) AS current_amount
      FROM savings_goals sg
      LEFT JOIN transactions t
        ON t.savings_goal_id = sg.id
        AND t.user_id = $1
      WHERE sg.user_id = $1
      GROUP BY sg.id
      ORDER BY sg.created_at DESC
      `,
      [userId]
    );

    return NextResponse.json({ success: true, data: res.rows });
  } catch (err) {
    return errorResponse(err, "GET SAVINGS ERROR");
  }
}

// ==========================================
// CREATE A NEW GOAL WITH ASSISTANT SETTINGS
// ==========================================
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const goal = parseGoalInput(await readJson(req));

    const res = await pool.query(
      `INSERT INTO savings_goals
        (name, target_amount, installment_amount, frequency, reminder_day, target_date, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [goal.name, goal.targetAmount, goal.installmentAmount, goal.frequency, goal.reminderDay, goal.targetDate, userId]
    );

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (err) {
    return errorResponse(err, "SAVINGS POST ERROR");
  }
}
