export const runtime = "nodejs";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { AppError, errorResponse, readJson, requireUserId } from "@/lib/api";
import { parseEnum, parseRequiredText } from "@/lib/validation";

const CATEGORY_TYPES = ["EXPENSE", "INCOME"] as const;

// =========================
// GET ALL CATEGORIES WITH TOTALS (USER-SCOPED)
// =========================
export async function GET() {
  try {
    const userId = await requireUserId();

    // `total` is the all-time sum of the user's transactions in each category
    const result = await pool.query(
      `
      SELECT c.id, c.name, c.type, COALESCE(SUM(t.amount), 0) AS total
      FROM categories c
      LEFT JOIN transactions t
        ON t.category_id = c.id
        AND t.user_id = $1
        AND t.type = c.type
      WHERE c.user_id = $1 OR c.user_id IS NULL
      GROUP BY c.id
      ORDER BY c.name ASC
      `,
      [userId]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    return errorResponse(err, "CATEGORY GET ERROR");
  }
}

// =========================
// CREATE CATEGORY (USER-SCOPED)
// =========================
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await readJson(req);
    const name = parseRequiredText(body.name, "Category name", 60);
    const type = parseEnum(body.type, CATEGORY_TYPES, "Category type");

    const result = await pool.query(
      `
      INSERT INTO categories (name, type, user_id)
      SELECT $1::text, $2::text, $3::uuid
      WHERE NOT EXISTS (
        SELECT 1 FROM categories
        WHERE (user_id = $3::uuid OR user_id IS NULL)
          AND LOWER(name) = LOWER($1::text)
          AND type = $2::text
      )
      RETURNING id, name, type
      `,
      [name, type, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError(`A ${type.toLowerCase()} category named "${name}" already exists.`, 409);
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err) {
    return errorResponse(err, "CATEGORY CREATE ERROR");
  }
}
