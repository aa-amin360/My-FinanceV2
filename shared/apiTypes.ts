// Shapes of the JSON returned by /api/*. Money and dates come from Postgres as
// strings (NUMERIC -> "12.50", DATE -> "YYYY-MM-DD").

export type Money = string;

export type Transaction = {
  id: number;
  type: string;
  amount: Money;
  date: string;
  note: string | null;
  source: string | null;
  entity_id: number | null;
  category_id: number | null;
  parent_id: number | null;
  savings_goal_id: number | null;
  category_name: string | null;
  entity_name: string | null;
  from_account: string | null;
  to_account: string | null;
  has_child: boolean;
  // A repayment the user recorded against an earlier debt/receivable (deletable)
  is_linked: boolean;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type TransactionPage = {
  data: Transaction[];
  pagination: Pagination;
};

export type Balances = {
  balance: number;
  cashBalance: number;
  bankBalance: number;
  savingsTotal: number;
};

export type Category = {
  id: number;
  name: string;
  type: string;
  // All-time total of the user's transactions in this category
  total: Money;
};

export type SavingsGoal = {
  id: number;
  name: string;
  target_amount: Money;
  current_amount: Money;
  target_date: string | null;
  installment_amount: Money | null;
  frequency: string;
  reminder_day: number | null;
  created_at: string;
};

export type PlanStatus = "PENDING" | "CONFIRMED" | "SKIPPED";

export type BudgetPlan = {
  id: number;
  type: "EXPENSE" | "INCOME";
  amount: Money;
  target_id: string | null;
  target_name: string;
  date: string;
  note: string | null;
  status: PlanStatus;
};

export type ObligationRow = {
  entity_id: number;
  name: string;
  total_amount: Money;
  remaining_amount: Money;
};

export type ReportRange = "ALL" | "YEAR" | "MONTH";

export type Report = {
  range: ReportRange;
  income: number;
  expense: number;
  categories: { name: string; value: number }[];
  trajectory: { date: string; balance: number }[];
};

export type WeeklyExpense = { day: string; amount: number };

export type OpeningBalanceStatus = {
  isInitialized: boolean;
  cashValue: number | null;
  bankValue: number | null;
};

export type NameAmount = { name: string; amount: number };
