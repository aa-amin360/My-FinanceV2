export const runtime = "nodejs";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { AppError, errorResponse, readJson, requireUserId } from "@/lib/api";
import { assertPlanCategory } from "@/lib/budget";
import { parseAmount, parseDate, parseEnum, parseId, parseOptionalId, parseRequiredText, parseText } from "@/lib/validation";

// Confirming a plan creates a transaction, so it only happens through /process
const EDITABLE_STATUSES = ["PENDING", "SKIPPED"] as const;

// ==========================================
// UPDATE A SPECIFIC BUDGET PLAN
// ==========================================
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const id = parseId(params.id, "Plan");
    const body = await readJson(req);

    const fields: string[] = [];
    const values: unknown[] = [];
    const set = (column: string, value: unknown) => {
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    };

    if (body.status !== undefined) set("status", parseEnum(body.status, EDITABLE_STATUSES, "Status"));
    if (body.amount !== undefined) set("amount", parseAmount(body.amount));
    if (body.date !== undefined) set("date", parseDate(body.date));
    if (body.note !== undefined) set("note", parseText(body.note, "Note", { max: 500, required: false }));
    if (body.target_name !== undefined) set("target_name", parseRequiredText(body.target_name, "Target", 255));

    const client = await pool.connect();
    try {
      if (body.target_id !== undefined) {
        const categoryId = parseOptionalId(body.target_id, "Category");
        const plan = await client.query(`SELECT type FROM budget_plans WHERE id = $1 AND user_id = $2`, [id, userId]);
        if (plan.rows.length === 0) throw new AppError("Plan not found.", 404);
        await assertPlanCategory(client, userId, categoryId, plan.rows[0].type);
        set("target_id", categoryId ? String(categoryId) : null);
      }

      if (fields.length === 0) {
        throw new AppError("No update fields provided.");
      }

      values.push(id, userId);
      const result = await client.query(
        `
        UPDATE budget_plans
        SET ${fields.join(", ")}
        WHERE id = $${values.length - 1} AND user_id = $${values.length}
        RETURNING *
        `,
        values
      );

      if (result.rows.length === 0) {
        throw new AppError("Plan not found.", 404);
      }

      return NextResponse.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (err) {
    return errorResponse(err, "UPDATE BUDGET PLAN ERROR");
  }
}

// ==========================================
// DELETE A SPECIFIC BUDGET PLAN
// ==========================================
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const id = parseId(params.id, "Plan");

    const result = await pool.query(`DELETE FROM budget_plans WHERE id = $1 AND user_id = $2 RETURNING id`, [
      id,
      userId,
    ]);

    if (result.rows.length === 0) {
      throw new AppError("Plan not found.", 404);
    }

    return NextResponse.json({ success: true, message: "Plan deleted successfully." });
  } catch (err) {
    return errorResponse(err, "DELETE BUDGET PLAN ERROR");
  }
}
