import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ==========================================
// GET ALL SAVINGS GOALS
// ==========================================
export async function GET() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT * FROM savings_goals 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [session.user.email]
    );
    return NextResponse.json({ success: true, data: res.rows });
  } catch (err: any) {
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
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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