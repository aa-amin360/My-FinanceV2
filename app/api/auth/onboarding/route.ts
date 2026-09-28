import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { errorResponse, requireUserId } from "@/lib/api";

// ==========================================
// GET USER ONBOARDING STATUS
// ==========================================
export async function GET() {
  try {
    const userId = await requireUserId();

    // Check both the static flag and if the user has any existing transaction history
    const res = await pool.query(
      `
      SELECT
        u.history_initialized,
        EXISTS (SELECT 1 FROM transactions WHERE user_id = u.id) AS has_transactions
      FROM users u
      WHERE u.id = $1
      `,
      [userId]
    );

    let historyInitialized = res.rows[0]?.history_initialized || false;
    const hasTransactions = res.rows[0]?.has_transactions || false;

    // Users who already have transactions are treated as onboarded permanently
    if (!historyInitialized && hasTransactions) {
      await pool.query("UPDATE users SET history_initialized = true WHERE id = $1", [userId]);
      historyInitialized = true;
    }

    return NextResponse.json({ success: true, history_initialized: historyInitialized });
  } catch (err) {
    return errorResponse(err, "GET ONBOARDING STATUS ERROR");
  }
}

// ==========================================
// SET ONBOARDING COMPLETED MANUALLY
// ==========================================
export async function POST() {
  try {
    const userId = await requireUserId();
    await pool.query("UPDATE users SET history_initialized = true WHERE id = $1", [userId]);

    return NextResponse.json({ success: true, message: "Onboarding successfully completed." });
  } catch (err) {
    return errorResponse(err, "POST ONBOARDING STATUS ERROR");
  }
}
