import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ==========================================
// GET ALL SAVINGS GOALS (DYNAMICALLY CALCULATED)
// ==========================================
export async function GET() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const client = await pool.connect();

  try {
    // This query will calculate the real-time savings balance from the ledger for each goal.
    const res = await client.query(
      `
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
            WHEN t.to_account = (SELECT id FROM accounts WHERE name = 'Savings' AND user_id = $1 LIMIT 1) THEN t.amount
            WHEN t.from_account = (SELECT id FROM accounts WHERE name = 'Savings' AND user_id = $1 LIMIT 1) THEN -t.amount
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
  } catch (err: any) {
    console.error("GET SAVINGS DYNAMIC ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// ==========================================
// CREATE A NEW GOAL WITH ASSISTANT SETTINGS
// ==========================================
export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      name, 
      target_amount, 
      target_date,
      installment_amount,
      frequency,
      reminder_day
    } = body;

    const client = await pool.connect();
    
    const res = await client.query(
      `INSERT INTO savings_goals 
        (name, target_amount, installment_amount, frequency, reminder_day, target_date, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        name, 
        Number(target_amount), 
        installment_amount ? Number(installment_amount) : null,
        frequency || 'MONTHLY',
        reminder_day ? Number(reminder_day) : null,
        target_date, 
        session.user.email
      ]
    );
    
    client.release();
    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (err: any) {
    console.error("SAVINGS POST ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}