import pool from "@/backend/db/pool";
import {
  getBalanceTrajectory,
  getDailyExpenses,
  getExpenseByCategory,
  getIncomeExpenseTotals,
} from "@/backend/repositories/reports";
import { getNamedBalances } from "@/backend/repositories/transactions";
import type { ReportRange } from "@/backend/validators/reports";
import { sumMoney } from "@/shared/money";

// Cash/Bank/Savings balances; `balance` is the spendable total (Cash + Bank)
export async function getBalances(userId: string) {
  const { cash, bank, savings } = await getNamedBalances(pool, userId);
  return {
    balance: sumMoney([cash, bank]),
    cashBalance: cash,
    bankBalance: bank,
    savingsTotal: savings,
  };
}

function rangeStart(range: ReportRange, today: string): string | null {
  if (range === "MONTH") return `${today.slice(0, 7)}-01`;
  if (range === "YEAR") return `${today.slice(0, 4)}-01-01`;
  return null;
}

// Summary figures for the dashboard and reports pages over the chosen period,
// anchored to the user's local date
export async function getReport(userId: string, range: ReportRange, today: string) {
  const startDate = rangeStart(range, today);
  const [totals, categories, trajectory] = await Promise.all([
    getIncomeExpenseTotals(pool, userId, startDate, today),
    getExpenseByCategory(pool, userId, startDate, today),
    getBalanceTrajectory(pool, userId, startDate, today),
  ]);

  return { range, ...totals, categories, trajectory };
}

const WEEK_DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

// Expenses per day for the Saturday-to-Friday week containing `today`
export async function getWeeklyExpenses(userId: string, today: string) {
  const day = new Date(`${today}T00:00:00Z`);
  const startOfWeek = addDays(day, -((day.getUTCDay() + 1) % 7));
  const endOfWeek = addDays(startOfWeek, 6);

  const totals = await getDailyExpenses(pool, userId, isoDate(startOfWeek), isoDate(endOfWeek));

  return WEEK_DAYS.map((label, index) => ({
    day: label,
    amount: totals.get(isoDate(addDays(startOfWeek, index))) || 0,
  }));
}
