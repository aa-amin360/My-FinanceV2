import pool, { withTransaction } from "@/backend/db/pool";
import { AppError } from "@/backend/http/AppError";
import { getAccountId } from "@/backend/repositories/accounts";
import { getEntityId } from "@/backend/repositories/entities";
import { addObligation } from "@/backend/repositories/obligations";
import { hasTransactionWithSource, insertTransaction, listOpeningBalances } from "@/backend/repositories/transactions";
import { lockUser } from "@/backend/repositories/users";
import type { HistoryInput } from "@/backend/validators/history";
import { TX_SOURCES } from "@/shared/transactionTypes";

// Whether opening balances were set, and the amounts used
export async function getOpeningBalanceStatus(userId: string) {
  const rows = await listOpeningBalances(pool, userId, TX_SOURCES.OPENING_BALANCE);

  let cashValue: number | null = null;
  let bankValue: number | null = null;
  for (const row of rows) {
    const name = String(row.account_name).trim().toLowerCase();
    if (name === "cash") cashValue = Number(row.amount);
    if (name === "bank") bankValue = Number(row.amount);
  }

  return { isInitialized: rows.length > 0, cashValue, bankValue };
}

// Opening balances can be set once. Opening debts/receivables can be added any time;
// they move money to/from nowhere so Cash/Bank balances are not affected.
export async function recordHistory(userId: string, input: HistoryInput) {
  const { cashBalance, bankBalance, debts, receivables, date } = input;

  await withTransaction(async (client) => {
    // 1. OPENING BALANCES (RUN-ONCE)
    if (cashBalance > 0 || bankBalance > 0) {
      // Lock the user row so two concurrent submissions cannot both pass the check
      await lockUser(client, userId);
      if (await hasTransactionWithSource(client, userId, TX_SOURCES.OPENING_BALANCE)) {
        throw new AppError("Opening balances have already been configured.", 409);
      }

      const openings: Array<[string, number]> = [
        ["Cash", cashBalance],
        ["Bank", bankBalance],
      ];
      for (const [accountName, amount] of openings) {
        if (amount <= 0) continue;
        await insertTransaction(client, userId, {
          type: "INCOME",
          amount,
          fromAccount: null,
          toAccount: await getAccountId(client, accountName, userId),
          date,
          note: "Opening Balance",
          source: TX_SOURCES.OPENING_BALANCE,
        });
      }
    }

    // 2. EXISTING DEBTS (Debt account -> nowhere, cash untouched)
    if (debts.length > 0) {
      const debtAccountId = await getAccountId(client, "Debt", userId);
      for (const debt of debts) {
        const entityId = await getEntityId(client, debt.name, "LIABILITY", userId);
        await addObligation(client, "debts", entityId, debt.amount, userId);
        await insertTransaction(client, userId, {
          type: "DEBT_TAKEN",
          amount: debt.amount,
          fromAccount: debtAccountId,
          toAccount: null,
          entityId,
          date,
          note: "Opening Debt",
          source: TX_SOURCES.OPENING_DEBT,
        });
      }
    }

    // 3. EXISTING RECEIVABLES (nowhere -> Receivable account, cash untouched)
    if (receivables.length > 0) {
      const receivableAccountId = await getAccountId(client, "Receivable", userId);
      for (const receivable of receivables) {
        const entityId = await getEntityId(client, receivable.name, "ASSET", userId);
        await addObligation(client, "receivables", entityId, receivable.amount, userId);
        await insertTransaction(client, userId, {
          type: "RECEIVABLE_GIVEN",
          amount: receivable.amount,
          fromAccount: null,
          toAccount: receivableAccountId,
          entityId,
          date,
          note: "Opening Receivable",
          source: TX_SOURCES.OPENING_RECEIVABLE,
        });
      }
    }
  });
}
