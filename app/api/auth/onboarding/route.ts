import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// ==========================================
// GET USER ONBOARDING STATUS (INTELLIGENT CHECK)
// ==========================================
export async function GET() {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id; // Stable database UUID
  const client = await pool.connect();

  try {
    // Check both the static flag and if the user has any existing transaction history
    const res = await client.query(
      `
      SELECT 
        u.history_initialized,
        EXISTS (SELECT 1 FROM transactions WHERE user_id = u.id LIMIT 1) AS has_transactions
      FROM users u 
      WHERE u.id = $1 
      LIMIT 1
      `,
      [userId]
    );

    let history_initialized = res.rows[0]?.history_initialized || false;
    const has_transactions = res.rows[0]?.has_transactions || false;

    // If they already started using the app (have transactions), dynamically onboard them permanently
    if (!history_initialized && has_transactions) {
      await client.query(
        "UPDATE users SET history_initialized = true WHERE id = $1",
        [userId]
      );
      history_initialized = true;
    }

    return NextResponse.json({
      success: true,
      history_initialized,
    });

  } catch (err: any) {
    console.error("GET ONBOARDING STATUS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch onboarding status." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// ==========================================
// SET ONBOARDING COMPLETED MANUALLY
// ==========================================
export async function POST() {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id; // Stable database UUID
  const client = await pool.connect();

  try {
    await client.query(
      "UPDATE users SET history_initialized = true WHERE id = $1",
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: "Onboarding successfully completed.",
    });

  } catch (err: any) {
    console.error("POST ONBOARDING STATUS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update onboarding status." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}