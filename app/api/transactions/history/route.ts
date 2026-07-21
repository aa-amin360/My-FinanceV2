import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { resolveAccounts } from "@/lib/transactions/accounts";

// ==========================================
// INLINE ENTITY HELPER
// ==========================================
async function getOrCreateEntityId(client: any, name: string, type: string, userId: string) {
  const clean = name.trim().toLowerCase();
  
  const res = await client.query(
    "SELECT id FROM entities WHERE LOWER(name) = $1 AND user_id = $2 LIMIT 1",
    [clean, userId]
  );

  if (res.rows.length > 0) return res.rows[0].id;

  const insert = await client.query(
    "INSERT INTO entities (name, type, user_id) VALUES ($1, $2, $3) RETURNING id",
    [clean, type, userId]
  );

  return insert.rows[0].id;
}

// ==========================================
// GET HISTORICAL BALANCES STATUS
// ==========================================
export async function GET() {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const client = await pool.connect();

  try {
    const res = await client.query(
      `
      SELECT t.amount, a.name AS account_name
      FROM transactions t
      JOIN accounts a ON t.to_account = a.id
      WHERE t.user_id = $1 AND t.note = 'Opening Balance'
      `,
      [userId]
    );

    let cashValue: number | null = null;
    let bankValue: number | null = null;
    const isInitialized = res.rows.length > 0;

    for (const row of res.rows) {
      const amt = Number(row.amount);
      const name = row.account_name.toLowerCase();
      if (name === "cash") cashValue = amt;
      if (name === "bank") bankValue = amt;
    }

    return NextResponse.json({
      success: true,
      isInitialized,
      cashValue,
      bankValue,
    });

  } catch (err: any) {
    console.error("GET HISTORY STATUS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to check historical balance status." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// ==========================================
// POST HISTORICAL ENTRIES
// ==========================================
export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const client = await pool.connect();

  try {
    const body = await req.json();
    const { cashBalance, bankBalance, debts, receivables } = body;

    const dateToday = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

    await client.query("BEGIN");

    // Fetch structural account IDs
    const accounts = await resolveAccounts(client, "Cash", userId);
    const cashAccountId = accounts.accountId;

    const bankAccounts = await resolveAccounts(client, "Bank", userId);
    const bankAccountId = bankAccounts.accountId;

    const { debtId, receivableId } = accounts;

    // ==========================================
    // 1. OPENING BALANCES (RUN-ONCE CHECK)
    // ==========================================
    const hasCash = typeof cashBalance === "number" && cashBalance > 0;
    const hasBank = typeof bankBalance === "number" && bankBalance > 0;

    if (hasCash || hasBank) {
      // Check if opening balances have already been initialized
      const balanceCheck = await client.query(
        "SELECT EXISTS (SELECT 1 FROM transactions WHERE user_id = $1 AND note = 'Opening Balance') AS exists",
        [userId]
      );

      const alreadyInitialized = balanceCheck.rows[0]?.exists || false;

      if (alreadyInitialized) {
        throw new Error("Opening balances have already been configured.");
      }

      if (hasCash) {
        await client.query(
          `
          INSERT INTO transactions 
            (type, amount, from_account, to_account, date, note, user_id)
          VALUES ('INCOME', $1, NULL, $2, $3, 'Opening Balance', $4)
          `,
          [cashBalance, cashAccountId, dateToday, userId]
        );
      }

      if (hasBank) {
        await client.query(
          `
          INSERT INTO transactions 
            (type, amount, from_account, to_account, date, note, user_id)
          VALUES ('INCOME', $1, NULL, $2, $3, 'Opening Balance', $4)
          `,
          [bankBalance, bankAccountId, dateToday, userId]
        );
      }
    }

    // ==========================================
    // 2. EXISTING DEBTS
    // ==========================================
    if (Array.isArray(debts) && debts.length > 0) {
      for (const d of debts) {
        const amt = Number(d.amount);
        const name = d.name ? d.name.trim() : "";

        if (!name || isNaN(amt) || amt <= 0) continue;

        // Resolve/Create the counterpart entity
        const entity_id = await getOrCreateEntityId(client, name, "LIABILITY", userId);

        // Update the debts tracking table
        await client.query(
          `
          INSERT INTO debts (entity_id, total_amount, remaining_amount, user_id)
          VALUES ($1, $2, $2, $3)
          ON CONFLICT (entity_id, user_id)
          DO UPDATE SET
            total_amount = debts.total_amount + $2,
            remaining_amount = debts.remaining_amount + $2
          `,
          [entity_id, amt, userId]
        );

        // Record a standard transaction (moves from Debt account to null to avoid double-counting cash)
        await client.query(
          `
          INSERT INTO transactions 
            (type, amount, from_account, to_account, entity_id, date, note, user_id)
          VALUES ('DEBT_TAKEN', $1, $2, NULL, $3, $4, 'Opening Debt', $5)
          `,
          [amt, debtId, entity_id, dateToday, userId]
        );
      }
    }

    // ==========================================
    // 3. EXISTING RECEIVABLES
    // ==========================================
    if (Array.isArray(receivables) && receivables.length > 0) {
      for (const r of receivables) {
        const amt = Number(r.amount);
        const name = r.name ? r.name.trim() : "";

        if (!name || isNaN(amt) || amt <= 0) continue;

        // Resolve/Create the counterpart entity
        const entity_id = await getOrCreateEntityId(client, name, "ASSET", userId);

        // Update the receivables tracking table
        await client.query(
          `
          INSERT INTO receivables (entity_id, total_amount, remaining_amount, user_id)
          VALUES ($1, $2, $2, $3)
          ON CONFLICT (entity_id, user_id)
          DO UPDATE SET
            total_amount = receivables.total_amount + $2,
            remaining_amount = receivables.remaining_amount + $2
          `,
          [entity_id, amt, userId]
        );

        // Record a standard transaction (moves from null to Receivable account to avoid double-counting cash)
        await client.query(
          `
          INSERT INTO transactions 
            (type, amount, from_account, to_account, entity_id, date, note, user_id)
          VALUES ('RECEIVABLE_GIVEN', $1, NULL, $2, $3, $4, 'Opening Receivable', $5)
          `,
          [amt, receivableId, entity_id, dateToday, userId]
        );
      }
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Historical positions recorded successfully.",
    });

  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("POST HISTORY ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Failed to record historical positions." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}