export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import pool, { withTransaction } from "@/lib/db";
import { errorResponse, readJson, requireUserId } from "@/lib/api";
import { isUserLinkedChild } from "@/lib/ledger";
import { createTransaction, parseCreateTransactionInput } from "@/lib/transactions/create";
import { TX_TYPES } from "@/lib/transactions/types";
import { isValidDateString, parseEnum, parseId } from "@/lib/validation";

const MAX_PAGE_SIZE = 100;
const MAX_ALL_ROWS = 20000;

// =========================
// POST (CREATE A NEW TRANSACTION)
// =========================
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const input = parseCreateTransactionInput(await readJson(req));

    await withTransaction((client) => createTransaction(client, userId, input));

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, "CREATE TRANSACTION ERROR");
  }
}

// =========================
// GET TRANSACTIONS
// =========================
// Query params:
//   page, limit       pagination over top-level transactions (limit max 100)
//   all=true          return every matching transaction (no pagination)
//   search            keyword in note, category or counterparty
//   startDate/endDate YYYY-MM-DD bounds
//   type              only this transaction type
//   entityId          only this counterparty
// Children of the returned transactions are always included (with parent_id set),
// each flagged with `is_linked` when it is a user-entered repayment.
export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);

    const all = searchParams.get("all") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

    const conditions = ["t.user_id = $1", "t.parent_id IS NULL"];
    const params: unknown[] = [userId];
    const addParam = (value: unknown) => {
      params.push(value);
      return `$${params.length}`;
    };

    const search = searchParams.get("search")?.trim();
    if (search) {
      const p = addParam(`%${search}%`);
      conditions.push(`(t.note ILIKE ${p} OR c.name ILIKE ${p} OR e.name ILIKE ${p})`);
    }

    const startDate = searchParams.get("startDate");
    if (isValidDateString(startDate)) conditions.push(`t.date >= ${addParam(startDate)}`);

    const endDate = searchParams.get("endDate");
    if (isValidDateString(endDate)) conditions.push(`t.date <= ${addParam(endDate)}`);

    const type = searchParams.get("type");
    if (type) conditions.push(`t.type = ${addParam(parseEnum(type, TX_TYPES, "Type"))}`);

    const entityId = searchParams.get("entityId");
    if (entityId) conditions.push(`t.entity_id = ${addParam(parseId(entityId, "Counterparty"))}`);

    const where = `WHERE ${conditions.join(" AND ")}`;
    const joins = `
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN entities e ON t.entity_id = e.id
      LEFT JOIN accounts fa ON t.from_account = fa.id
      LEFT JOIN accounts ta ON t.to_account = ta.id
    `;
    const columns = `
      t.id, t.type, t.amount, t.date, t.note, t.source,
      t.entity_id, t.category_id, t.parent_id, t.savings_goal_id,
      c.name AS category_name, e.name AS entity_name,
      fa.name AS from_account, ta.name AS to_account
    `;

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN entities e ON t.entity_id = e.id
       ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const pageLimit = all ? MAX_ALL_ROWS : limit;
    const offset = all ? 0 : (page - 1) * limit;
    const rootsRes = await pool.query(
      `SELECT ${columns}
       FROM transactions t
       ${joins}
       ${where}
       ORDER BY t.date DESC, t.created_at DESC, t.id DESC
       LIMIT ${addParam(pageLimit)} OFFSET ${addParam(offset)}`,
      params
    );
    const roots = rootsRes.rows;

    // Attach the children of the returned transactions
    const rootIds = roots.map((r) => r.id);
    const childrenRes = rootIds.length
      ? await pool.query(
          `SELECT ${columns}
           FROM transactions t
           ${joins}
           WHERE t.user_id = $1 AND t.parent_id = ANY($2::int[])
           ORDER BY t.date ASC, t.created_at ASC, t.id ASC`,
          [userId, rootIds]
        )
      : { rows: [] as Record<string, unknown>[] };

    const rootTypes = new Map(roots.map((r) => [r.id, r.type as string]));
    const childParentIds = new Set(childrenRes.rows.map((c) => c.parent_id));

    const data = [
      ...roots.map((r) => ({ ...r, has_child: childParentIds.has(r.id), is_linked: false })),
      ...childrenRes.rows.map((c) => ({
        ...c,
        has_child: false,
        is_linked: isUserLinkedChild(c.type as string, rootTypes.get(c.parent_id as number) ?? ""),
      })),
    ];

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        page: all ? 1 : page,
        limit: all ? total : limit,
        totalPages: all ? 1 : Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    return errorResponse(err, "GET TRANSACTIONS ERROR");
  }
}
