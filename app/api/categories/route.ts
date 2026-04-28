export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// =========================
// GET ALL CATEGORIES (USER-SCOPED)
// =========================
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.email;

  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      SELECT id, name, type
      FROM categories
      WHERE user_id = $1 OR user_id IS NULL
      ORDER BY name ASC
      `,
      [userId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });

  } catch (err: any) {
    console.error("CATEGORY GET ERROR:", err);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// =========================
// CREATE CATEGORY (USER-SCOPED)
// =========================
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.email;

  const client = await pool.connect();

  try {
    const body = await req.json();
    const { name, type } = body;

    if (!name || !type) {
      throw new Error("Name and type required");
    }

    const result = await client.query(
      `
      INSERT INTO categories (name, type, user_id)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [name, type, userId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });

  } catch (err: any) {
    console.error("CATEGORY CREATE ERROR:", err);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
