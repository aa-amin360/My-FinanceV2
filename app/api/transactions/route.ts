import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Pool } from "pg";

import { resolveAccounts } from "@/lib/transactions/accounts";
import { resolveEntity } from "@/lib/transactions/entity";
import { buildFlow } from "@/lib/transactions/flow";
import { checkBalance } from "@/lib/transactions/balance";
import { insertTransaction } from "@/lib/transactions/insert";
import { handleDebt } from "@/lib/transactions/debt";
import { handleReceivable } from "@/lib/transactions/receivable";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
      id,
      type,
      amount,
      account,
      category_id,
      entity,
      date,
      note,
      direction,
    } = body;
    
    const isEdit = !!id;
    
    // =========================
    // 🧨 EDIT MODE: REVERSE + DELETE
    // =========================
    if (isEdit) {
      // 1️⃣ get original transaction
      const oldTxRes = await client.query(
        `SELECT * FROM transactions WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
    
      const oldTx = oldTxRes.rows[0];
    
      if (!oldTx) {
        throw new Error("Transaction not found for edit");
      }
    
      // 2️⃣ get children (important for split cases)
      const childrenRes = await client.query(
        `SELECT * FROM transactions WHERE parent_id = $1 AND user_id = $2`,
        [id, userId]
      );
    
      const children = childrenRes.rows;
    
      const allTx = [oldTx, ...children];
    
      // =========================
      // 🔄 REVERSE EFFECTS
      // =========================
      for (const tx of allTx) {
        const amt = Number(tx.amount);
        const entityId = tx.entity_id;
    
        if (!entityId) continue;
    
        // ---- DEBT ----
        if (tx.type === "DEBT_TAKEN") {
          await client.query(
            `UPDATE debts
             SET total_amount = total_amount - $2,
                 remaining_amount = remaining_amount - $2
             WHERE entity_id = $1 AND user_id = $3`,
            [entityId, amt, userId]
          );
        }
    
        if (tx.type === "DEBT_REPAID") {
          await client.query(
            `UPDATE debts
             SET remaining_amount = remaining_amount + $2
             WHERE entity_id = $1 AND user_id = $3`,
            [entityId, amt, userId]
          );
        }
    
        // ---- RECEIVABLE ----
        if (tx.type === "RECEIVABLE_GIVEN") {
          await client.query(
            `UPDATE receivables
             SET total_amount = total_amount - $2,
                 remaining_amount = remaining_amount - $2
             WHERE entity_id = $1 AND user_id = $3`,
            [entityId, amt, userId]
          );
        }
    
        if (tx.type === "RECEIVABLE_RECEIVED") {
          await client.query(
            `UPDATE receivables
             SET remaining_amount = remaining_amount + $2
             WHERE entity_id = $1 AND user_id = $3`,
            [entityId, amt, userId]
          );
        }
      }
    
      // =========================
      // 🧹 DELETE OLD TREE
      // =========================
    
      await client.query(
        `DELETE FROM transactions WHERE parent_id = $1 AND user_id = $2`,
        [id, userId]
      );
    
      await client.query(
        `DELETE FROM transactions WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
    }

    
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

    // =========================
    // UPDATE (EDIT MODE)
    // =========================
    if (id) {
      await client.query(
        `
        UPDATE transactions
        SET 
          type = $1,
          amount = $2,
          from_account = $3,
          to_account = $4,
          entity_id = $5,
          category_id = $6,
          date = $7,
          note = $8
        WHERE id = $9 AND user_id = $10
        `,
        [
          type,
          amountNumber,
          from_account,
          to_account,
          entity_id,
          category_id || null,
          date,
          note,
          id,
          userId,
        ]
      );
    
      await client.query("COMMIT");
      return NextResponse.json({ success: true });
    }
    
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
      ]);
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

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  const client = await pool.connect();

  try {
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
      ORDER BY t.date DESC, t.created_at DESC;
      `,
      [userId]
    );

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
