import { NextResponse } from "next/server";
import pool, { withTransaction } from "@/lib/db";
import { AppError, errorResponse, readJson, requireUserId } from "@/lib/api";
import { parseGoalInput } from "@/lib/savings";
import { TX_SOURCES } from "@/lib/transactions/types";
import { dateOrToday, parseEnum, parseId } from "@/lib/validation";

const DELETE_ACTIONS = ["REFUND", "SPENT"] as const;

// ==========================================
// DELETE A SAVINGS GOAL
// ==========================================
// REFUND: remove the goal's transfers so the money returns to Cash/Bank.
// SPENT:  record the saved amount as an expense from Savings, keep the history.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const goalId = parseId(params.id, "Savings goal");
    const { searchParams } = new URL(req.url);
    const action = parseEnum(searchParams.get("action") || "REFUND", DELETE_ACTIONS, "Action");
    const date = dateOrToday(searchParams.get("date"));

    await withTransaction(async (client) => {
      const goalRes = await client.query(
        "SELECT name FROM savings_goals WHERE id = $1 AND user_id = $2 FOR UPDATE",
        [goalId, userId]
      );
      if (goalRes.rows.length === 0) {
        throw new AppError("Savings goal not found.", 404);
      }
      const goalName = goalRes.rows[0].name;

      if (action === "REFUND") {
        await client.query("DELETE FROM transactions WHERE savings_goal_id = $1 AND user_id = $2", [goalId, userId]);
      } else {
        const savingsAccountRes = await client.query(
          "SELECT id FROM accounts WHERE LOWER(TRIM(name)) = 'savings' AND user_id = $1 ORDER BY id LIMIT 1",
          [userId]
        );
        const savingsAccountId = savingsAccountRes.rows[0]?.id;

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
          [savingsAccountId ?? null, goalId, userId]
        );
        const totalSaved = Number(balanceRes.rows[0]?.total_saved || 0);

        if (totalSaved > 0 && savingsAccountId) {
          await client.query(
            `
            INSERT INTO transactions
              (type, amount, from_account, to_account, date, note, user_id, savings_goal_id, source)
            VALUES ('EXPENSE', $1, $2, NULL, $3, $4, $5, NULL, $6)
            `,
            [totalSaved, savingsAccountId, date, `Goal Achieved & Spent: ${goalName}`, userId, TX_SOURCES.GOAL_SPENT]
          );
        }

        // Keep the historic transfers but detach them from the goal being removed
        await client.query(
          "UPDATE transactions SET savings_goal_id = NULL WHERE savings_goal_id = $1 AND user_id = $2",
          [goalId, userId]
        );
      }

      await client.query("DELETE FROM savings_goals WHERE id = $1 AND user_id = $2", [goalId, userId]);
    });

    return NextResponse.json({ success: true, message: "Goal removed and ledger adjusted." });
  } catch (err) {
    return errorResponse(err, "DELETE GOAL ERROR");
  }
}

// ==========================================
// UPDATE A SAVINGS GOAL (Edit Commitment)
// ==========================================
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const goalId = parseId(params.id, "Savings goal");
    const goal = parseGoalInput(await readJson(req));

    const res = await pool.query(
      `UPDATE savings_goals
       SET name = $1, target_amount = $2, installment_amount = $3, frequency = $4, reminder_day = $5, target_date = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [goal.name, goal.targetAmount, goal.installmentAmount, goal.frequency, goal.reminderDay, goal.targetDate, goalId, userId]
    );

    if (res.rows.length === 0) {
      throw new AppError("Savings goal not found.", 404);
    }

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (err) {
    return errorResponse(err, "UPDATE GOAL ERROR");
  }
}
