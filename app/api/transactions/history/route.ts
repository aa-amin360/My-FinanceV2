import { NextResponse } from "next/server";
import pool, { withTransaction } from "@/lib/db";
import { AppError, errorResponse, readJson, requireUserId } from "@/lib/api";
import { getAccountId } from "@/lib/transactions/accounts";
import { getEntityId } from "@/lib/transactions/entity";
import { addObligation } from "@/lib/transactions/obligations";
import { TX_SOURCES } from "@/lib/transactions/types";
import { dateOrToday, parseAmount, parseNonNegativeAmount, parseRequiredText } from "@/lib/validation";

const MAX_ENTRIES = 100;

type HistoryEntry = { name: string; amount: number };

function parseEntries(value: unknown, label: string): HistoryEntry[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new AppError(`${label} must be a list.`);
  if (value.length > MAX_ENTRIES) throw new AppError(`You can add at most ${MAX_ENTRIES} ${label.toLowerCase()} at once.`);

  return value.map((entry, index) => {
    const row = (entry ?? {}) as Record<string, unknown>;
    return {
      name: parseRequiredText(row.name, `${label} #${index + 1} name`, 100),
      amount: parseAmount(row.amount, `${label} #${index + 1} amount`),
    };
  });
}

// ==========================================
// GET HISTORICAL BALANCES STATUS
// ==========================================
export async function GET() {
  try {
    const userId = await requireUserId();

    const res = await pool.query(
      `
      SELECT t.amount, a.name AS account_name
      FROM transactions t
      JOIN accounts a ON t.to_account = a.id
      WHERE t.user_id = $1 AND t.source = $2
      `,
      [userId, TX_SOURCES.OPENING_BALANCE]
    );

    let cashValue: number | null = null;
    let bankValue: number | null = null;

    for (const row of res.rows) {
      const name = String(row.account_name).trim().toLowerCase();
      if (name === "cash") cashValue = Number(row.amount);
      if (name === "bank") bankValue = Number(row.amount);
    }

    return NextResponse.json({
      success: true,
      isInitialized: res.rows.length > 0,
      cashValue,
      bankValue,
    });
  } catch (err) {
    return errorResponse(err, "GET HISTORY STATUS ERROR");
  }
}

// ==========================================
// POST HISTORICAL ENTRIES
// ==========================================
// Opening balances can be set once. Opening debts/receivables can be added any time;
// they move money to/from nowhere so Cash/Bank balances are not affected.
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await readJson(req);

    const cashBalance = parseNonNegativeAmount(body.cashBalance, "Cash balance");
    const bankBalance = parseNonNegativeAmount(body.bankBalance, "Bank balance");
    const debts = parseEntries(body.debts, "Debts");
    const receivables = parseEntries(body.receivables, "Receivables");
    const date = dateOrToday(body.date);

    await withTransaction(async (client) => {
      // 1. OPENING BALANCES (RUN-ONCE)
      if (cashBalance > 0 || bankBalance > 0) {
        // Lock the user row so two concurrent submissions cannot both pass the check
        await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [userId]);

        const existing = await client.query(
          "SELECT 1 FROM transactions WHERE user_id = $1 AND source = $2 LIMIT 1",
          [userId, TX_SOURCES.OPENING_BALANCE]
        );
        if (existing.rows.length > 0) {
          throw new AppError("Opening balances have already been configured.", 409);
        }

        const openings: Array<[string, number]> = [
          ["Cash", cashBalance],
          ["Bank", bankBalance],
        ];
        for (const [accountName, amount] of openings) {
          if (amount <= 0) continue;
          const accountId = await getAccountId(client, accountName, userId);
          await client.query(
            `
            INSERT INTO transactions (type, amount, from_account, to_account, date, note, user_id, source)
            VALUES ('INCOME', $1, NULL, $2, $3, 'Opening Balance', $4, $5)
            `,
            [amount, accountId, date, userId, TX_SOURCES.OPENING_BALANCE]
          );
        }
      }

      // 2. EXISTING DEBTS (Debt account -> nowhere, cash untouched)
      if (debts.length > 0) {
        const debtAccountId = await getAccountId(client, "Debt", userId);
        for (const debt of debts) {
          const entityId = await getEntityId(client, debt.name, "LIABILITY", userId);
          await addObligation(client, "debts", entityId, debt.amount, userId);
          await client.query(
            `
            INSERT INTO transactions (type, amount, from_account, to_account, entity_id, date, note, user_id, source)
            VALUES ('DEBT_TAKEN', $1, $2, NULL, $3, $4, 'Opening Debt', $5, $6)
            `,
            [debt.amount, debtAccountId, entityId, date, userId, TX_SOURCES.OPENING_DEBT]
          );
        }
      }

      // 3. EXISTING RECEIVABLES (nowhere -> Receivable account, cash untouched)
      if (receivables.length > 0) {
        const receivableAccountId = await getAccountId(client, "Receivable", userId);
        for (const receivable of receivables) {
          const entityId = await getEntityId(client, receivable.name, "ASSET", userId);
          await addObligation(client, "receivables", entityId, receivable.amount, userId);
          await client.query(
            `
            INSERT INTO transactions (type, amount, from_account, to_account, entity_id, date, note, user_id, source)
            VALUES ('RECEIVABLE_GIVEN', $1, NULL, $2, $3, $4, 'Opening Receivable', $5, $6)
            `,
            [receivable.amount, receivableAccountId, entityId, date, userId, TX_SOURCES.OPENING_RECEIVABLE]
          );
        }
      }
    });

    return NextResponse.json({ success: true, message: "Historical positions recorded successfully." });
  } catch (err) {
    return errorResponse(err, "POST HISTORY ERROR");
  }
}
