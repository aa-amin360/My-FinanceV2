export const runtime = "nodejs";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { errorResponse, readJson, requireUserId } from "@/lib/api";
import { assertPlanCategory, PLAN_TYPES } from "@/lib/budget";
import { parseAmount, parseDate, parseEnum, parseInteger, parseOptionalId, parseRequiredText, parseText } from "@/lib/validation";

// ==========================================
// GET BUDGET PLANS (FILTERED BY MONTH/YEAR)
// ==========================================
export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const month = parseInteger(searchParams.get("month"), "Month", 1, 12);
    const year = parseInteger(searchParams.get("year"), "Year", 1900, 3000);

    const result = await pool.query(
      `
      SELECT id, type, amount, target_id, target_name, date, note, status
      FROM budget_plans
      WHERE user_id = $1
        AND EXTRACT(MONTH FROM date) = $2
        AND EXTRACT(YEAR FROM date) = $3
      ORDER BY date ASC, created_at ASC
      `,
      [userId, month, year]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    return errorResponse(err, "GET BUDGET PLANS ERROR");
  }
}

// ==========================================
// CREATE A NEW BUDGET PLAN
// ==========================================
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await readJson(req);

    const type = parseEnum(body.type, PLAN_TYPES, "Planning type");
    const amount = parseAmount(body.amount);
    const targetName = parseRequiredText(body.target_name, "Target", 255);
    const date = parseDate(body.date);
    const note = parseText(body.note, "Note", { max: 500, required: false });
    const categoryId = parseOptionalId(body.target_id, "Category");

    const client = await pool.connect();
    try {
      await assertPlanCategory(client, userId, categoryId, type);

      const result = await client.query(
        `
        INSERT INTO budget_plans (type, amount, target_id, target_name, date, note, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
        [type, amount, categoryId ? String(categoryId) : null, targetName, date, note, userId]
      );

      return NextResponse.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (err) {
    return errorResponse(err, "CREATE BUDGET PLAN ERROR");
  }
}
