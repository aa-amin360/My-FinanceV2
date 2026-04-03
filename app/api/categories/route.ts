export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// =========================
// GET ALL CATEGORIES
// =========================
export async function GET() {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT id, name, type
      FROM categories
      ORDER BY name ASC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  } finally {
    client.release();
  }
}

// =========================
// CREATE CATEGORY
// =========================
export async function POST(req: Request) {
  const client = await pool.connect();

  try {
    const body = await req.json();
    const { name, type } = body;

    if (!name || !type) {
      throw new Error("Name and type required");
    }

    const result = await client.query(
      `
      INSERT INTO categories (name, type)
      VALUES ($1, $2)
      RETURNING *
      `,
      [name, type]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  } finally {
    client.release();
  }
}
