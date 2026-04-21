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

async function getAccountId(client: any, name: string) {
  const res = await client.query(
    `SELECT id FROM accounts WHERE name = $1 LIMIT 1`,
    [name]
  );

  if (res.rows.length === 0) {
    throw new Error(`Account not found: ${name}`);
  }

  return res.rows[0].id;
}

async function getEntityId(client: any, name: string, type: string) {
  const clean = name.trim().toLowerCase();

  const res = await client.query(
    `SELECT id FROM entities WHERE LOWER(name) = $1 LIMIT 1`,
    [clean]
  );

  if (res.rows.length > 0) return res.rows[0].id;

  const insert = await client.query(
    `INSERT INTO entities (name, type)
     VALUES ($1, $2)
     RETURNING id`,
    [clean, type]
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
    } = body;

    const amountNumber = Number(amount);

    if (!type || !amountNumber || !account || !date) {
      throw new Error("Missing required fields");
    }

    // =========================
    // ACCOUNT IDS
    // =========================

    const accountId = await getAccountId(client, account);
    const savingsId = await getAccountId(client, "Savings");
    const debtId = await getAccountId(client, "Debt");
    const receivableId = await getAccountId(client, "Receivable");

    // =========================
    // ENTITY
    // =========================

    let entity_id: string | null = null;

    if (entity) {
      const meta = TYPE_META[type as keyof typeof TYPE_META];
      
      if (meta.group === "DEBT") {
        entity_id = await getEntityId(client, entity, "LIABILITY");
      } else if (meta.group === "RECEIVABLE") {
        entity_id = await getEntityId(client, entity, "ASSET");
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

    const balanceRes = await client.query(`
      SELECT COALESCE(SUM(
        CASE
          WHEN type IN ('INCOME','DEBT_TAKEN','RECEIVABLE_RECEIVED') THEN amount
          ELSE -amount
        END
      ), 0) AS balance
      FROM transactions
    `);

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

    const result = await client.query(
      let result = null;
      
      // ⚠️ ONLY INSERT IF NOT SPLIT CASE
      if (
        type !== "DEBT_REPAID" &&
        type !== "RECEIVABLE_RECEIVED"
      ) {
        result = await client.query(
          `INSERT INTO transactions 
          (type, amount, from_account, to_account, entity_id, category_id, date, note)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
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
          ]
        );
      }
    );

    // =========================
    // STATE SYNC
    // =========================

    if (entity_id) {
      // ---------- DEBT ----------
      if (type === "DEBT_TAKEN") {
        await client.query(
          `
          INSERT INTO debts (entity_id, total_amount, remaining_amount)
          VALUES ($1, $2, $2)
          ON CONFLICT (entity_id)
          DO UPDATE SET
            total_amount = debts.total_amount + $2,
            remaining_amount = debts.remaining_amount + $2
        `,
          [entity_id, amountNumber]
        );
      }

      if (type === "DEBT_REPAID") {
        const debtRes = await client.query(
          `SELECT * FROM debts WHERE entity_id = $1`,
          [entity_id]
        );
      
        const currentRemaining = Number(
          debtRes.rows[0]?.remaining_amount || 0
        );
      
        if (amountNumber > currentRemaining) {
          // 🔥 SPLIT HERE
          const repayAmount = currentRemaining;
          const extra = amountNumber - currentRemaining;
      
          // ===== INSERT CORRECT REPAY =====
          await client.query(
            `INSERT INTO transactions
             (type, amount, from_account, to_account, entity_id, category_id, date, note)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              "DEBT_REPAID",
              repayAmount,
              from_account,
              to_account,
              entity_id,
              category_id || null,
              date,
              note,
            ]
          );
      
          // ===== UPDATE DEBT =====
          await client.query(
            `UPDATE debts
             SET total_amount = 0,
                 remaining_amount = 0
             WHERE entity_id = $1`,
            [entity_id]
          );
      
          // ===== CREATE RECEIVABLE =====
          if (extra > 0) {
            await client.query(
              `
              INSERT INTO receivables (entity_id, total_amount, remaining_amount)
              VALUES ($1, $2, $2)
              ON CONFLICT (entity_id)
              DO UPDATE SET
                total_amount = receivables.total_amount + $2,
                remaining_amount = receivables.remaining_amount + $2
              `,
              [entity_id, extra]
            );
      
            // 🔥 SECOND TRANSACTION (only extra)
            await client.query(
              `INSERT INTO transactions
               (type, amount, from_account, to_account, entity_id, date, note)
               VALUES ($1,$2,$3,$4,$5,$6,$7)`,
              [
                "RECEIVABLE_GIVEN",
                extra,
                from_account,
                receivableId,
                entity_id,
                date,
                "Auto conversion",
              ]
            );
          }
      
          await client.query("COMMIT");
      
          return NextResponse.json({ success: true });
        }
      }

      // ---------- RECEIVABLE ----------
      if (type === "RECEIVABLE_GIVEN") {
        await client.query(
          `
          INSERT INTO receivables (entity_id, total_amount, remaining_amount)
          VALUES ($1, $2, $2)
          ON CONFLICT (entity_id)
          DO UPDATE SET
            total_amount = receivables.total_amount + $2,
            remaining_amount = receivables.remaining_amount + $2
        `,
          [entity_id, amountNumber]
        );
      }

      if (type === "RECEIVABLE_RECEIVED") {
        const recvRes = await client.query(
          `SELECT * FROM receivables WHERE entity_id = $1`,
          [entity_id]
        );
      
        const currentRemaining = Number(
          recvRes.rows[0]?.remaining_amount || 0
        );
      
        if (amountNumber > currentRemaining) {
          // ===== SPLIT =====
          const receiveAmount = currentRemaining;
          const extra = amountNumber - currentRemaining;
      
          // ===== INSERT CORRECT RECEIVE =====
          await client.query(
            `INSERT INTO transactions
             (type, amount, from_account, to_account, entity_id, category_id, date, note)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              "RECEIVABLE_RECEIVED",
              receiveAmount,
              from_account,
              to_account,
              entity_id,
              category_id || null,
              date,
              note,
            ]
          );
      
          // ===== UPDATE RECEIVABLE =====
          await client.query(
            `
            UPDATE receivables
            SET total_amount = 0,
                remaining_amount = 0
            WHERE entity_id = $1
            `,
            [entity_id]
          );
      
          // ===== CREATE DEBT =====
          if (extra > 0) {
            await client.query(
              `
              INSERT INTO debts (entity_id, total_amount, remaining_amount)
              VALUES ($1, $2, $2)
              ON CONFLICT (entity_id)
              DO UPDATE SET
                total_amount = debts.total_amount + $2,
                remaining_amount = debts.remaining_amount + $2
              `,
              [entity_id, extra]
            );
      
            // ===== SECOND TRANSACTION =====
            await client.query(
              `INSERT INTO transactions
               (type, amount, from_account, to_account, entity_id, date, note)
               VALUES ($1,$2,$3,$4,$5,$6,$7)`,
              [
                "DEBT_TAKEN",
                extra,
                debtId,
                to_account,
                entity_id,
                date,
                "Auto conversion",
              ]
            );
          }
      
          await client.query("COMMIT");
      
          return NextResponse.json({ success: true });
        }
      }
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      data: result.rows[0],
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
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT 
        t.id,
        t.type,
        t.amount,
        t.date,
        t.note,
        t.entity_id,
        t.category_id,
        c.name AS category_name,
        e.name AS entity_name,
        fa.name AS from_account,
        ta.name AS to_account
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN entities e ON t.entity_id = e.id
      LEFT JOIN accounts fa ON t.from_account = fa.id
      LEFT JOIN accounts ta ON t.to_account = ta.id
      ORDER BY t.date DESC, t.created_at DESC;
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
