import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ==========================================
// DELETE A SAVINGS GOAL (WITH AUTOMATIC REFUND OR EXPENSE ADJUSTMENT)
// ==========================================
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const id = params.id;
  const parsedGoalId = parseInt(id); // Cast string ID to integer to prevent SQL type mismatches

  const { searchParams } = new URL(req.url);
  const actionType = searchParams.get("action") || "REFUND"; 

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Fetch the goal details first to get the target name
    const goalRes = await client.query(
      "SELECT name FROM savings_goals WHERE id = $1 AND user_id = $2 LIMIT 1",
      [parsedGoalId, userId]
    );

    if (goalRes.rows.length === 0) {
      throw new Error("Savings goal not found.");
    }

    const goalName = goalRes.rows[0].name;

    // Fetch the Savings account ID (using case-insensitive and trimmed lookup for safety)
    const savingsAccountRes = await client.query(
      "SELECT id FROM accounts WHERE LOWER(TRIM(name)) = 'savings' AND user_id = $1 LIMIT 1",
      [userId]
    );
    const savingsAccountId = savingsAccountRes.rows[0]?.id;

    // Debugging logs to verify variables in the terminal
    console.log("=== DEBUGGING GOAL ACHIEVE ===");
    console.log("Goal Name:", goalName);
    console.log("Parsed Goal ID:", parsedGoalId);
    console.log("Savings Account ID:", savingsAccountId);

    if (actionType === "REFUND") {
      // 1. REFUND Path: Delete all associated transfer transactions
      await client.query(
        "DELETE FROM transactions WHERE savings_goal_id = $1 AND user_id = $2",
        [parsedGoalId, userId]
      );
    } else if (actionType === "SPENT") {
      // 2. SPENT Path (Goal Achieved): Calculate total saved for this goal
      const balanceRes = await client.query(
        `
        SELECT COALESCE(SUM(
          CASE 
            WHEN t.to_account = $1 THEN t.amount
            WHEN t.from_account = $1 THEN -t.amount
            ELSE 0
          END
        ), 0) AS total_saved
        FROM transactions t
        WHERE t.savings_goal_id = $2 AND t.user_id = $3
        `,
        [savingsAccountId, parsedGoalId, userId]
      );

      const totalSaved = Number(balanceRes.rows[0]?.total_saved || 0);
      console.log("Total Saved calculated by Ledger:", totalSaved);

      // Create an EXPENSE transaction of the same amount from 'Savings'
      if (totalSaved > 0 && savingsAccountId) {
        const dateToday = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
        await client.query(
          `
          INSERT INTO transactions 
            (type, amount, from_account, to_account, date, note, user_id, savings_goal_id)
          VALUES ('EXPENSE', $1, $2, NULL, $3, $4, $5, NULL)
          `,
          [totalSaved, savingsAccountId, dateToday, `Goal Achieved & Spent: ${goalName}`, userId]
        );
        console.log("EXPENSE transaction created successfully!");
      } else {
        console.log("EXPENSE transaction skipped. Reason: Saved amount is 0 or account ID is missing.");
      }

      // Decouple historic transactions
      await client.query(
        "UPDATE transactions SET savings_goal_id = NULL WHERE savings_goal_id = $1 AND user_id = $2",
        [parsedGoalId, userId]
      );
    }

    // 3. Delete the goal definition itself
    await client.query(
      "DELETE FROM savings_goals WHERE id = $1 AND user_id = $2",
      [parsedGoalId, userId]
    );

    await client.query("COMMIT");
    console.log("Database transaction committed successfully.");
    console.log("===============================");
    
    return NextResponse.json({ success: true, message: "Goal removed and ledger adjusted." });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("DELETE GOAL ERROR:", err);
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

  const userId = session.user.id;
  const id = params.id;
  const parsedGoalId = parseInt(id);

  try {
    const body = await req.json();
    const { name, target_amount, installment_amount, frequency, reminder_day, target_date } = body;

    const client = await pool.connect();
    const res = await client.query(
      `UPDATE savings_goals 
       SET name = $1, target_amount = $2, installment_amount = $3, frequency = $4, reminder_day = $5, target_date = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [name, target_amount, installment_amount, frequency, reminder_day, target_date, parsedGoalId, userId]
    );

    client.release();
    if (res.rows.length === 0) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}