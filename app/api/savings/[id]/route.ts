import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ==========================================
// DELETE A SAVINGS GOAL
// ==========================================
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.email;
  const id = params.id;

  const client = await pool.connect();
  try {
    // We only delete the goal definition. 
    // The money already transferred to "Savings" in the ledger stays in the ledger.
    await client.query(
      "DELETE FROM savings_goals WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    return NextResponse.json({ success: true, message: "Goal removed." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// ==========================================
// UPDATE A SAVINGS GOAL (Edit Commitment)
// ==========================================
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.email;
  const id = params.id;

  try {
    const body = await req.json();
    const { name, target_amount, installment_amount, frequency, reminder_day, target_date } = body;

    const client = await pool.connect();
    const res = await client.query(
      `UPDATE savings_goals 
       SET name = $1, target_amount = $2, installment_amount = $3, frequency = $4, reminder_day = $5, target_date = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [name, target_amount, installment_amount, frequency, reminder_day, target_date, id, userId]
    );

    client.release();
    if (res.rows.length === 0) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}