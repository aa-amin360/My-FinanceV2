import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import pool from "@/lib/db";

import { resolveAccounts } from "@/lib/transactions/accounts";
import { resolveEntity } from "@/lib/transactions/entity";
import { buildFlow } from "@/lib/transactions/flow";
import { checkBalance } from "@/lib/transactions/balance";
import { insertTransaction } from "@/lib/transactions/insert";
import { handleDebt } from "@/lib/transactions/debt";
import { handleReceivable } from "@/lib/transactions/receivable";

const TYPE_META = {
  INCOME: { flow: "IN", group: "BALANCE" },
  EXPENSE: { flow: "OUT", group: "BALANCE" },
  TRANSFER: { flow: "MOVE", group: "BALANCE" },
  DEBT_TAKEN: { flow: "IN", group: "DEBT" },
  DEBT_REPAID: { flow: "OUT", group: "DEBT" },
  RECEIVABLE_GIVEN: { flow: "OUT", group: "RECEIVABLE" },
  RECEIVABLE_RECEIVED: { flow: "IN", group: "RECEIVABLE" },
} as const;

// =========================
// POST
// =========================

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");  

    const body = await req.json();
    
    const {
      type,
      amount,
      account,
      category_id,
      entity,
      date,
      note,
      direction,
      savings_goal_id,
    } = body;
    
    const amountNumber = Number(amount);

    if (!type || !amountNumber || !account || !date) {
      throw new Error("Missing required fields");
    }

    const accounts = await resolveAccounts(client, account, userId);

    const entity_id = await resolveEntity(
      client,
      entity,
      type,
      userId,
      TYPE_META
    );

    const { from_account, to_account } = buildFlow(
      type,
      direction,
      accounts,
      entity_id
    );

    await checkBalance(
      client,
      accounts.accountId,
      userId,
      type,
      amountNumber,
      TYPE_META
    );

    // insert normal
    if (type !== "DEBT_REPAID" && type !== "RECEIVABLE_RECEIVED") {
      await insertTransaction(client, [
        type,
        amountNumber,
        from_account,
        to_account,
        entity_id,
        category_id || null,
        date,
        note,
        userId,
        savings_goal_id || null,
      ]);
    }

    // ==========================================
    // SAVINGS GOAL PROGRESS LOGIC
    // ==========================================
    if (type === "TRANSFER" && savings_goal_id) {
      if (direction === "TO_SAVINGS") {
        await client.query(
          "UPDATE savings_goals SET current_amount = current_amount + $1 WHERE id = $2 AND user_id = $3",
          [amountNumber, savings_goal_id, userId]
        );
      } else if (direction === "FROM_SAVINGS") {
        await client.query(
          "UPDATE savings_goals SET current_amount = current_amount - $1 WHERE id = $2 AND user_id = $3",
          [amountNumber, savings_goal_id, userId]
        );
      }
    }

    // debt
    const debtResult = await handleDebt({
      client,
      type,
      entity_id,
      amountNumber,
      from_account,
      to_account,
      category_id,
      date,
      note,
      userId,
      receivableId: accounts.receivableId,
    });

    if (debtResult === "COMMIT_EARLY") {
      await client.query("COMMIT");
      return NextResponse.json({ success: true });
    }

    // receivable
    const recResult = await handleReceivable({
      client,
      type,
      entity_id,
      amountNumber,
      from_account,
      to_account,
      category_id,
      date,
      note,
      userId,
      receivableId: accounts.receivableId,
      debtId: accounts.debtId,
    });

    if (recResult === "COMMIT_EARLY") {
      await client.query("COMMIT");
      return NextResponse.json({ success: true });
    }

    await client.query("COMMIT");

    return NextResponse.json({ success: true });

  } catch (err: any) {
    await client.query("ROLLBACK");

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// =========================
// GET (With Pagination)
// =========================

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const { searchParams } = new URL(req.url);
  
  // Pagination Params
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const client = await pool.connect();

  try {
    // 1. Get Total Count (for the frontend pagination controls)
    const countRes = await client.query(
      `SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND parent_id IS NULL`,
      [userId]
    );
    const total = parseInt(countRes.rows[0].count);

    // 2. Get Paginated Data
    const result = await client.query(
      `
      SELECT 
        t.id,
        t.type,
        t.amount,
        t.date,
        t.note,
        t.entity_id,
        t.category_id,
        t.parent_id,
        t.savings_goal_id,
      
        EXISTS (
          SELECT 1 
          FROM transactions t2
          WHERE t2.parent_id = t.id
        ) AS has_child,
      
        c.name AS category_name,
        e.name AS entity_name,
        fa.name AS from_account,
        ta.name AS to_account
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN entities e ON t.entity_id = e.id
      LEFT JOIN accounts fa ON t.from_account = fa.id
      LEFT JOIN accounts ta ON t.to_account = ta.id
      WHERE t.user_id = $1
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT $2 OFFSET $3;
      `,
      [userId, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  } finally {
    client.release();
  }
}