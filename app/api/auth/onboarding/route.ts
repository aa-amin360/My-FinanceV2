import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// ==========================================
// GET USER ONBOARDING STATUS
// ==========================================
export async function GET() {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const client = await pool.connect();

  try {
    const res = await client.query(
      "SELECT history_initialized FROM users WHERE email = $1 LIMIT 1",
      [userId]
    );

    const history_initialized = res.rows[0]?.history_initialized || false;

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
// SET ONBOARDING COMPLETED
// ==========================================
export async function POST() {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const client = await pool.connect();

  try {
    await client.query(
      "UPDATE users SET history_initialized = true WHERE email = $1",
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
