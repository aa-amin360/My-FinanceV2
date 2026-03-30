export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper: get account ID by name
async function getAccountId(client: any, name: string) {
  const res = await client.query(
    `SELECT id FROM accounts WHERE name = $1 LIMIT 1`,
    [name]
  );
  if (res.rows.length === 0) throw new Error(`Account not found: ${name}`);
  return res.rows[0].id;
}

export async function POST(req: Request) {
  const client = await pool.connect();

  try {
    const body = await req.json();

    const {
      type,
      amount,
      account,
      category_id,
      entity_id,
      date,
      note,
      direction, // for savings
    } = body;

    // =========================
    // VALIDATION
    // =========================
    if (!type || !amount || !account || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be positive" },
        { status: 400 }
      );
    }

    // =========================
    // GET ACCOUNT IDs
    // =========================
    const accountId = await getAccountId(client, account);
    const savingsId = await getAccountId(client, "Savings");
    const debtId = await getAccountId(client, "Debt");
    const receivableId = await getAccountId(client, "Receivable");

    let from_account: string | null = null;
    let to_account: string | null = null;

    // =========================
    // FLOW MAPPING
    // =========================
    switch (type) {
      case "INCOME":
        from_account = null;
        to_account = accountId;
        break;

      case "EXPENSE":
        from_account = accountId;
        to_account = null;
        break;

      case "TRANSFER":
        if (!direction) {
          return NextResponse.json(
            { error: "Direction required for transfer" },
            { status: 400 }
          );
        }

        if (direction === "TO_SAVINGS") {
          from_account = accountId;
          to_account = savingsId;
        } else if (direction === "FROM_SAVINGS") {
          from_account = savingsId;
          to_account = accountId;
        } else {
          return NextResponse.json(
            { error: "Invalid transfer direction" },
            { status: 400 }
          );
        }
        break;

      case "DEBT_TAKEN":
        if (!entity_id) {
          return NextResponse.json(
            { error: "Entity required for debt" },
            { status: 400 }
          );
        }
        from_account = debtId;
        to_account = accountId;
        break;

      case "DEBT_REPAID":
        if (!entity_id) {
          return NextResponse.json(
            { error: "Entity required for debt repayment" },
            { status: 400 }
          );
        }
        from_account = accountId;
        to_account = debtId;
        break;

      case "RECEIVABLE_GIVEN":
        if (!entity_id) {
          return NextResponse.json(
            { error: "Entity required" },
            { status: 400 }
          );
        }
        from_account = accountId;
        to_account = receivableId;
        break;

      case "RECEIVABLE_RECEIVED":
        if (!entity_id) {
          return NextResponse.json(
            { error: "Entity required" },
            { status: 400 }
          );
        }
        from_account = receivableId;
        to_account = accountId;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid transaction type" },
          { status: 400 }
        );
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
        entity_id || null,
        date,
        note || null,
      ]
    );

    // =========================
    // UPDATE DEBT
    // =========================
    if (type === "DEBT_TAKEN") {
      await client.query(
        `INSERT INTO debts (entity_id, total_amount, remaining_amount)
         VALUES ($1, $2, $2)
         ON CONFLICT (entity_id)
         DO UPDATE SET
           total_amount = debts.total_amount + $2,
           remaining_amount = debts.remaining_amount + $2`,
        [entity_id, amount]
      );
    }

    if (type === "DEBT_REPAID") {
      await client.query(
        `UPDATE debts
         SET remaining_amount = remaining_amount - $1
         WHERE entity_id = $2`,
        [amount, entity_id]
      );
    }

    // =========================
    // UPDATE RECEIVABLE
    // =========================
    if (type === "RECEIVABLE_GIVEN") {
      await client.query(
        `INSERT INTO receivables (entity_id, total_amount, remaining_amount)
         VALUES ($1, $2, $2)
         ON CONFLICT (entity_id)
         DO UPDATE SET
           total_amount = receivables.total_amount + $2,
           remaining_amount = receivables.remaining_amount + $2`,
        [entity_id, amount]
      );
    }

    if (type === "RECEIVABLE_RECEIVED") {
      await client.query(
        `UPDATE receivables
         SET remaining_amount = remaining_amount - $1
         WHERE entity_id = $2`,
        [amount, entity_id]
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

