export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { errorResponse, requireUserId } from "@/lib/api";

// Reset the user's ledger: every transaction plus the debt/receivable totals
// derived from them. Savings goals, budget plans and categories are kept.
// Opening balances are removed too, so the user is sent through onboarding again.
export async function DELETE() {
  try {
    const userId = await requireUserId();

    await withTransaction(async (client) => {
      await client.query(`DELETE FROM transactions WHERE user_id = $1`, [userId]);
      await client.query(`DELETE FROM debts WHERE user_id = $1`, [userId]);
      await client.query(`DELETE FROM receivables WHERE user_id = $1`, [userId]);
      await client.query(`UPDATE users SET history_initialized = false WHERE id = $1`, [userId]);
    });

    return NextResponse.json({ success: true, message: "User ledger reset successfully" });
  } catch (err) {
    return errorResponse(err, "DELETE ALL TRANSACTIONS ERROR");
  }
}
