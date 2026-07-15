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

    // Determine which account to check for sufficient funds
    let accountToCheck = accounts.accountId; // Default to Cash/Bank

    if (type === "TRANSFER" && direction === "FROM_SAVINGS") {
      accountToCheck = accounts.savingsId; // Check Savings balance if withdrawing
    }

    await checkBalance(
      client,
      accountToCheck, // Now dynamically picks the source
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
// GET
// =========================
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const { searchParams } = new URL(req.url);
  
  // 1. Pagination & Filter Params
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const searchTerm = searchParams.get("search") || "";
  const startDate = searchParams.get("startDate"); // YYYY-MM-DD
  const endDate = searchParams.get("endDate");     // YYYY-MM-DD

  const client = await pool.connect();

  try {
    // 2. Build the WHERE clause dynamically
    let whereClause = `WHERE t.user_id = $1 AND t.parent_id IS NULL`;
    let queryParams: any[] = [userId];
    let paramIndex = 2;

    // Search filter (Keyword in note, category, or entity)
    if (searchTerm) {
      whereClause += ` AND (
        t.note ILIKE $${paramIndex} OR 
        c.name ILIKE $${paramIndex} OR 
        e.name ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // Date range filters
    if (startDate) {
      whereClause += ` AND t.date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      whereClause += ` AND t.date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }

    // 3. Get Total Count for the filtered set
    const countQuery = `
      SELECT COUNT(*) 
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN entities e ON t.entity_id = e.id
      ${whereClause}
    `;
    const countRes = await client.query(countQuery, queryParams);
    const total = parseInt(countRes.rows[0].count);

    // 4. Get Paginated & Filtered Data
    const dataQuery = `
      SELECT 
        t.id, t.type, t.amount, t.date, t.note, 
        t.entity_id, t.category_id, t.parent_id, t.savings_goal_id,
        EXISTS (SELECT 1 FROM transactions t2 WHERE t2.parent_id = t.id) AS has_child,
        c.name AS category_name, e.name AS entity_name,
        fa.name AS from_account, ta.name AS to_account
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN entities e ON t.entity_id = e.id
      LEFT JOIN accounts fa ON t.from_account = fa.id
      LEFT JOIN accounts ta ON t.to_account = ta.id
      ${whereClause}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    
    queryParams.push(limit, offset);
    const result = await client.query(dataQuery, queryParams);

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
    console.error("GET TRANSACTIONS ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}