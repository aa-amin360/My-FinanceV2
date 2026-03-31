export const runtime = "nodejs";

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
  const res = await client.query(
    `SELECT id FROM entities WHERE name = $1 LIMIT 1`,
    [name]
  );

  if (res.rows.length > 0) {
    return res.rows[0].id;
  }

  const insert = await client.query(
    `INSERT INTO entities (name, type)
     VALUES ($1, $2)
     RETURNING id`,
    [name, type]
  );

  return insert.rows[0].id;
}

// =========================
// POST → CREATE TRANSACTION
// =========================

export async function POST(req: Request) {
  const client = await pool.connect();

  try {
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

    if (!type || !amount || !account || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const accountId = await getAccountId(client, account);
    const savingsId = await getAccountId(client, "Savings");
    const debtId = await getAccountId(client, "Debt");
    const receivableId = await getAccountId(client, "Receivable");

    let entity_id: string | null = null;

    if (entity) {
      if (type === "DEBT_TAKEN" || type === "DEBT_REPAID") {
        entity_id = await getEntityId(client, entity, "LIABILITY");
      } else if (
        type === "RECEIVABLE_GIVEN" ||
        type === "RECEIVABLE_RECEIVED"
      ) {
        entity_id = await getEntityId(client, entity, "ASSET");
      }
    }

    let from_account: string | null = null;
    let to_account: string | null = null;

    // =========================
    // FLOW LOGIC
    // =========================

    switch (type) {
      case "INCOME":
        to_account = accountId;
        break;

      case "EXPENSE":
        from_account = accountId;
        break;

      case "TRANSFER":
        if (direction === "TO_SAVINGS") {
          from_account = accountId;
          to_account = savingsId;
        } else if (direction === "FROM_SAVINGS") {
          from_account = savingsId;
          to_account = accountId;
        }
        break;

      case "DEBT_TAKEN":
        from_account = debtId;
        to_account = accountId;
        break;

      case "DEBT_REPAID":
        from_account = accountId;
        to_account = debtId;
        break;

      case "RECEIVABLE_GIVEN":
        from_account = accountId;
        to_account = receivableId;
        break;

      case "RECEIVABLE_RECEIVED":
        from_account = receivableId;
        to_account = accountId;
        break;

      default:
        throw new Error("Invalid transaction type");
    }

    // =========================
    // INSERT TRANSACTION
    // =========================

    const result = await client.query(
      `INSERT INTO transactions 
      (type, amount, from_account, to_account, category_id, entity_id, date, note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        type,
        amount,
        from_account,
        to_account,
        category_id || null,
        entity_id,
        date,
        note || null,
      ]
    );

    // =========================
    // ✅ FIXED DEBT LOGIC
    // =========================

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
        [entity_id, amount]
      );
    }

    if (type === "DEBT_REPAID") {
      await client.query(
        `
        UPDATE debts
        SET remaining_amount = remaining_amount - $1
        WHERE entity_id = $2
        `,
        [amount, entity_id]
      );
    }

    // =========================
    // ✅ FIXED RECEIVABLE LOGIC
    // =========================

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
        [entity_id, amount]
      );
    }

    if (type === "RECEIVABLE_RECEIVED") {
      await client.query(
        `
        UPDATE receivables
        SET remaining_amount = remaining_amount - $1
        WHERE entity_id = $2
        `,
        [amount, entity_id]
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });

  } catch (err: any) {
    console.error("TRANSACTION ERROR:", err);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// =========================
// GET → FETCH TRANSACTIONS
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
        fa.name AS from_account,
        ta.name AS to_account
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account = fa.id
      LEFT JOIN accounts ta ON t.to_account = ta.id
      ORDER BY t.date DESC, t.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
