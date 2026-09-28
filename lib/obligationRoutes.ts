import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { errorResponse, requireUserId } from "@/lib/api";
import type { ObligationTable } from "@/lib/transactions/obligations";

// GET handlers shared by /api/debts and /api/receivables

export function totalHandler(table: ObligationTable) {
  return async function GET() {
    try {
      const userId = await requireUserId();
      const result = await pool.query(
        `SELECT COALESCE(SUM(remaining_amount), 0) AS total FROM ${table} WHERE user_id = $1`,
        [userId]
      );
      return NextResponse.json({ success: true, total: Number(result.rows[0]?.total) || 0 });
    } catch (err) {
      return errorResponse(err, `${table.toUpperCase()} TOTAL ERROR`);
    }
  };
}

export function detailsHandler(table: ObligationTable) {
  return async function GET() {
    try {
      const userId = await requireUserId();
      const result = await pool.query(
        `
        SELECT o.entity_id, e.name, o.total_amount, o.remaining_amount
        FROM ${table} o
        JOIN entities e ON o.entity_id = e.id
        WHERE o.user_id = $1
        ORDER BY o.remaining_amount DESC
        `,
        [userId]
      );
      return NextResponse.json({ success: true, data: result.rows });
    } catch (err) {
      return errorResponse(err, `${table.toUpperCase()} DETAILS ERROR`);
    }
  };
}
