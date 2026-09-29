import { AppError } from "@/backend/http/AppError";
import type { JsonBody } from "@/backend/http/request";
import { dateOrToday, parseAmount, parseNonNegativeAmount, parseRequiredText } from "@/backend/validators/common";

const MAX_HISTORY_ENTRIES = 100;

export type HistoryEntry = { name: string; amount: number };

function parseEntries(value: unknown, label: string): HistoryEntry[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new AppError(`${label} must be a list.`);
  if (value.length > MAX_HISTORY_ENTRIES) {
    throw new AppError(`You can add at most ${MAX_HISTORY_ENTRIES} ${label.toLowerCase()} at once.`);
  }

  return value.map((entry, index) => {
    const row = (entry ?? {}) as JsonBody;
    return {
      name: parseRequiredText(row.name, `${label} #${index + 1} name`, 100),
      amount: parseAmount(row.amount, `${label} #${index + 1} amount`),
    };
  });
}

// Opening balances plus existing debts/receivables entered during onboarding
export function parseHistoryInput(body: JsonBody) {
  return {
    cashBalance: parseNonNegativeAmount(body.cashBalance, "Cash balance"),
    bankBalance: parseNonNegativeAmount(body.bankBalance, "Bank balance"),
    debts: parseEntries(body.debts, "Debts"),
    receivables: parseEntries(body.receivables, "Receivables"),
    date: dateOrToday(body.date),
  };
}

export type HistoryInput = ReturnType<typeof parseHistoryInput>;
