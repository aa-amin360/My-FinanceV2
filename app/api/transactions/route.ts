import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// =========================
// HELPERS
// =========================

async function getAccountId(client: any, name: string, userId: string) {
  const res = await client.query(
    `SELECT id FROM accounts WHERE name = $1 AND user_id = $2 LIMIT 1`,
    [name, userId]
  );

  if (res.rows.length > 0) return res.rows[0].id;

  const insert = await client.query(
    `INSERT INTO accounts (name, type, user_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [
      name,
      name === "Debt"
        ? "LIABILITY"
        : "ASSET",
      userId,
    ]
  );

  return insert.rows[0].id;
}

async function getEntityId(client: any, name: string, type: string, userId: string) {
  const clean = name.trim().toLowerCase();

  const res = await client.query(
    `SELECT id FROM entities WHERE LOWER(name) = $1 AND user_id = $2 LIMIT 1`,
    [clean, userId]
  );

  if (res.rows.length > 0) return res.rows[0].id;

  const insert = await client.query(
    `INSERT INTO entities (name, type, user_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [clean, type, userId]
  );

  return insert.rows[0].id;
}

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

    let {
      type,
      amount,
      account,
      category_id,
      entity,
      date,
      note,
      direction,
    } = body;
    
    // =========================
    // AUTO TYPE RESOLUTION
    // =========================
    if (!type) {
      if (category_id && !entity) {
        type = "EXPENSE";
      } else if (entity) {
        type = "DEBT_TAKEN";
      }
    }
    
    // =========================
    // VALIDATION
    // =========================
    const amountNumber = Number(amount);
    
    if (!type || !amountNumber || !account || !date) {
      throw new Error("Missing required fields");
    }
    

    const {
      type,
      amount,
      account,
      category_id,
      entity,
      date,
      note,
      direction,
    } = body;

    const amountNumber = Number(amount);

    if (!type || !amountNumber || !account || !date) {
      throw new Error("Missing required fields");
    }

    // =========================
    // ACCOUNT IDS
    // =========================

    const accountId = await getAccountId(client, account, userId);
    const savingsId = await getAccountId(client, "Savings", userId);
    const debtId = await getAccountId(client, "Debt", userId);
    const receivableId = await getAccountId(client, "Receivable", userId);

    // =========================
    // ENTITY
    // =========================

    let entity_id: string | null = null;

    if (entity) {
      const meta = TYPE_META[type as keyof typeof TYPE_META];
      
      if (meta.group === "DEBT") {
        entity_id = await getEntityId(client, entity, "LIABILITY", userId);
      } else if (meta.group === "RECEIVABLE") {
        entity_id = await getEntityId(client, entity, "ASSET", userId);
      }
    }

    // =========================
    // ACCOUNT FLOW
    // =========================

    let from_account: string | null = null;
    let to_account: string | null = null;

    switch (type) {
      case "INCOME":
        to_account = accountId;
        break;

      case "EXPENSE":
        from_account = accountId;
        break;

      case "TRANSFER":
        if (!direction) throw new Error("Direction required");

        if (direction === "TO_SAVINGS") {
          from_account = accountId;
          to_account = savingsId;
        } else {
          from_account = savingsId;
          to_account = accountId;
        }
        break;

      case "DEBT_TAKEN":
        if (!entity_id) throw new Error("Entity required");
        from_account = debtId;
        to_account = accountId;
        break;

      case "DEBT_REPAID":
        if (!entity_id) throw new Error("Entity required");
        from_account = accountId;
        to_account = debtId;
        break;

      case "RECEIVABLE_GIVEN":
        if (!entity_id) throw new Error("Entity required");
        from_account = accountId;
        to_account = receivableId;
        break;

      case "RECEIVABLE_RECEIVED":
        if (!entity_id) throw new Error("Entity required");
        from_account = receivableId;
        to_account = accountId;
        break;

      default:
        throw new Error("Invalid type");
    }

    // =========================
    // BALANCE CHECK
    // =========================

    const balanceRes = await client.query(
      `
      SELECT COALESCE(SUM(
        CASE
          WHEN to_account = $1 THEN amount
          WHEN from_account = $1 THEN -amount
          ELSE 0
        END
      ), 0) AS balance
      FROM transactions
      WHERE user_id = $2
      `,
      [accountId, userId]
    );

    const balance = Number(balanceRes.rows[0].balance || 0);

    if (
      TYPE_META[type as keyof typeof TYPE_META].flow === "OUT" &&
      amountNumber > balance
    ) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // =========================
    // INSERT TRANSACTION
    // =========================

    let result = null;
    
    // ⚠️ ONLY INSERT IF NOT SPLIT CASE
    if (
      type !== "DEBT_REPAID" &&
      type !== "RECEIVABLE_RECEIVED"
    ) {
      result = await client.query(
        `INSERT INTO transactions 
        (type, amount, from_account, to_account, entity_id, category_id, date, note, user_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *`,
        [
          type,
          amountNumber,
          from_account,
          to_account,
          entity_id,
          category_id || null,
          date,
          note,
          userId,
        ]
      );
    }

    // =========================
    // STATE SYNC
    // =========================

    if (entity_id) {
      // ---------- DEBT ----------
      if (type === "DEBT_TAKEN") {
        await client.query(
          `
          INSERT INTO debts (entity_id, total_amount, remaining_amount, user_id)
          VALUES ($1, $2, $2, $3)
          ON CONFLICT (entity_id, user_id)
          DO UPDATE SET
            total_amount = debts.total_amount + $2,
            remaining_amount = debts.remaining_amount + $2
        `,
          [entity_id, amountNumber, userId]
        );
      }

      if (type === "DEBT_REPAID") {
        const debtRes = await client.query(
          `SELECT * FROM debts WHERE entity_id = $1 AND user_id = $2`,
          [entity_id, userId]
        );
      
        const currentRemaining = Number(
          debtRes.rows[0]?.remaining_amount || 0
        );
      
        // =========================
        // 🔥 OVERPAY (SPLIT CASE)
        // =========================
        if (amountNumber > currentRemaining) {
          const repayAmount = currentRemaining;
          const extra = amountNumber - currentRemaining;
      
          // 🔍 find DEBT_TAKEN
          const debtTaken = await client.query(
            `SELECT id FROM transactions
             WHERE entity_id = $1 AND type = 'DEBT_TAKEN' AND user_id = $2
             ORDER BY date DESC LIMIT 1`,
            [entity_id, userId]
          );
          
          if (debtTaken.rows.length === 0) {
            throw new Error("No DEBT_TAKEN found for this entity");
          }
          
          const parentDebtId = debtTaken.rows[0].id;
          
          // 1️⃣ Correct repay
          const repayTx = await client.query(
            `INSERT INTO transactions
             (type, amount, from_account, to_account, entity_id, category_id, date, note, parent_id, user_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             RETURNING id`,
            [
              "DEBT_REPAID",
              repayAmount,
              from_account,
              to_account,
              entity_id,
              category_id || null,
              date,
              note,
              parentDebtId,
              userId, 
            ]
          );
          
          const parentId = repayTx.rows[0].id;
      
          // 2️⃣ Clear debt
          await client.query(
            `UPDATE debts
             SET total_amount = 0,
                 remaining_amount = 0
             WHERE entity_id = $1 AND user_id = $2`,
            [entity_id, userId]
          );
      
          // 3️⃣ Create receivable from extra
          if (extra > 0) {
            await client.query(
              `INSERT INTO receivables (entity_id, total_amount, remaining_amount, user_id)
               VALUES ($1, $2, $2, $3)
               ON CONFLICT (entity_id, user_id)
               DO UPDATE SET
                 total_amount = receivables.total_amount + $2,
                 remaining_amount = receivables.remaining_amount + $2`,
              [entity_id, extra, userId]
            );
      
            await client.query(
              `INSERT INTO transactions
               (type, amount, from_account, to_account, entity_id, date, note, parent_id, user_id)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
              [
                "RECEIVABLE_GIVEN",
                extra,
                from_account,
                receivableId,
                entity_id,
                date,
                "Auto conversion",
                parentId,
                userId,
              ]
            );
          }
      
          await client.query("COMMIT");
          return NextResponse.json({ success: true });
        }
      
        // =========================
        // ✅ NORMAL REPAY
        // =========================
        else {
          // 1️⃣ Insert DEBT_REPAID
          await client.query(
            `INSERT INTO transactions
             (type, amount, from_account, to_account, entity_id, category_id, date, note, user_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
              "DEBT_REPAID",
              amountNumber,
              from_account,
              to_account,
              entity_id,
              category_id || null,
              date,
              note,
              userId,
            ]
          );
        
          // 2️⃣ Reduce debt
          await client.query(
            `UPDATE debts
             SET remaining_amount = remaining_amount - $2
             WHERE entity_id = $1 AND user_id = $3`,
            [entity_id, amountNumber, userId]
          );
        
          // 3️⃣ Clean if zero
          await client.query(
            `DELETE FROM debts
             WHERE entity_id = $1 AND user_id = $2 AND remaining_amount <= 0`,
            [entity_id, userId]
          );
        }
      }

      // ---------- RECEIVABLE ----------
      if (type === "RECEIVABLE_GIVEN") {
        await client.query(
          `
          INSERT INTO receivables (entity_id, total_amount, remaining_amount, user_id)
          VALUES ($1, $2, $2, $3)
          ON CONFLICT (entity_id, user_id)
          DO UPDATE SET
            total_amount = receivables.total_amount + $2,
            remaining_amount = receivables.remaining_amount + $2
        `,
          [entity_id, amountNumber, userId]
        );
      }

      if (type === "RECEIVABLE_RECEIVED") {
        const recRes = await client.query(
          `SELECT * FROM receivables WHERE entity_id = $1 AND user_id = $2`,
          [entity_id, userId]
        );
      
        const currentRemaining = Number(
          recRes.rows[0]?.remaining_amount || 0
        );
      
        // =========================
        // 🔥 OVER-RECEIVED (SPLIT)
        // =========================
        if (amountNumber > currentRemaining) {
          const receiveAmount = currentRemaining;
          const extra = amountNumber - currentRemaining;
      
          // 1️⃣ Correct receive (only actual receivable)
          const receiveTx = await client.query(
            `INSERT INTO transactions
             (type, amount, from_account, to_account, entity_id, category_id, date, note, user_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             RETURNING id`,
            [
              "RECEIVABLE_RECEIVED",
              receiveAmount,
              from_account,
              to_account,
              entity_id,
              category_id || null,
              date,
              note,
              userId,
            ]
          );
          
          const parentId = receiveTx.rows[0].id;
      
          // 2️⃣ Clear receivable
          await client.query(
            `UPDATE receivables
             SET total_amount = 0,
                 remaining_amount = 0
             WHERE entity_id = $1 AND user_id = $2`,
            [entity_id, userId]
          );
      
          // 3️⃣ Convert extra → RECEIVABLE
          if (extra > 0) {
            await client.query(
              `INSERT INTO receivables (entity_id, total_amount, remaining_amount, user_id)
               VALUES ($1, $2, $2, $3)
               ON CONFLICT (entity_id, user_id)
               DO UPDATE SET
                 total_amount = receivables.total_amount + $2,
                 remaining_amount = receivables.remaining_amount + $2`,
              [entity_id, extra, userId]
            );
          
            await client.query(
              `INSERT INTO transactions
               (type, amount, from_account, to_account, entity_id, date, note, parent_id, user_id)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
              [
                "RECEIVABLE_GIVEN",
                extra,
                from_account,
                receivableId,
                entity_id,
                date,
                "Auto conversion",
                parentId,
                userId,
              ]
            );
          }
      
          await client.query("COMMIT");
          return NextResponse.json({ success: true });
        }
      
        // =========================
        // ✅ NORMAL RECEIVE
        // =========================
        else {
          // 1️⃣ Insert transaction
          await client.query(
            `INSERT INTO transactions
             (type, amount, from_account, to_account, entity_id, category_id, date, note, user_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
              "RECEIVABLE_RECEIVED",
              amountNumber,
              from_account,
              to_account,
              entity_id,
              category_id || null,
              date,
              note,
              userId,
            ]
          );
      
          // 2️⃣ Reduce receivable
          await client.query(
            `UPDATE receivables
             SET remaining_amount = remaining_amount - $2
             WHERE entity_id = $1 AND user_id = $3`,
            [entity_id, amountNumber, userId]
          );
      
          // 3️⃣ Auto delete if zero
          await client.query(
            `DELETE FROM receivables
             WHERE entity_id = $1 AND user_id = $2 AND remaining_amount <= 0`,
            [entity_id, userId]
          );
        }
      }
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      data: result?.rows?.[0] || null,
    });

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

  const userId = session.user.email; // you are using email as id

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
