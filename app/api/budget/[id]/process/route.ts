export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { AppError, errorResponse, readJson, requireUserId } from "@/lib/api";
import { planCategoryId } from "@/lib/budget";
import { SPENDABLE_ACCOUNTS } from "@/lib/config";
import { subtractMoney } from "@/lib/money";
import { createTransaction } from "@/lib/transactions/create";
import { dateOrToday, parseAmount, parseEnum, parseId } from "@/lib/validation";

const ACTIONS = ["CONFIRM", "PARTIAL"] as const;

// ==========================================
// TURN A PLANNED ITEM INTO A REAL TRANSACTION
// ==========================================
// The transaction and the plan update happen in one database transaction so a
// failure can never leave a recorded payment with a still-pending plan.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const id = parseId(params.id, "Plan");
    const body = await readJson(req);

    const action = parseEnum(body.action, ACTIONS, "Action");
    const account = parseEnum(body.account, SPENDABLE_ACCOUNTS, "Account");
    const date = dateOrToday(body.date);

    await withTransaction(async (client) => {
      const planRes = await client.query(
        `SELECT * FROM budget_plans WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [id, userId]
      );
      const plan = planRes.rows[0];
      if (!plan) throw new AppError("Plan not found.", 404);
      if (plan.status !== "PENDING") throw new AppError("This plan has already been processed.");

      const planAmount = Number(plan.amount);
      const amount = action === "CONFIRM" ? planAmount : parseAmount(body.amount, "Partial amount");
      if (action === "PARTIAL" && amount >= planAmount) {
        throw new AppError("Partial amount must be less than the planned amount.");
      }

      const suffix = action === "CONFIRM" ? "(Planned)" : "(Partial planned)";
      await createTransaction(client, userId, {
        type: plan.type,
        amount,
        account,
        date,
        note: plan.note ? `${plan.note} ${suffix}` : action === "CONFIRM" ? "Planned event confirmed" : "Partial planned event",
        direction: null,
        entity: null,
        categoryId: planCategoryId(plan.target_id),
        savingsGoalId: null,
      });

      if (action === "CONFIRM") {
        await client.query(`UPDATE budget_plans SET status = 'CONFIRMED' WHERE id = $1`, [id]);
      } else {
        await client.query(`UPDATE budget_plans SET amount = $1 WHERE id = $2`, [
          subtractMoney(planAmount, amount),
          id,
        ]);
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, "PROCESS BUDGET PLAN ERROR");
  }
}
