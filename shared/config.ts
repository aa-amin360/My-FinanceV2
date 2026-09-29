// App-wide settings shared by client and server code.
// Override the currency label with NEXT_PUBLIC_CURRENCY (e.g. "USD", "€").

export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "Tk";
export const NUMBER_LOCALE = process.env.NEXT_PUBLIC_NUMBER_LOCALE || "en-BD";

// Spendable accounts a user can pick when recording a transaction.
// Savings, Debt and Receivable are internal ledger accounts and never picked directly.
export const SPENDABLE_ACCOUNTS = ["Cash", "Bank"] as const;
export type SpendableAccount = (typeof SPENDABLE_ACCOUNTS)[number];

export const ACCOUNT_OPTIONS = SPENDABLE_ACCOUNTS.map((name) => ({ value: name, label: name }));

export function formatNumber(value: number | string) {
  return Number(value).toLocaleString(NUMBER_LOCALE);
}

export function formatMoney(value: number | string) {
  return `${formatNumber(value)} ${CURRENCY}`;
}

// The user's local calendar date as YYYY-MM-DD
export function localDateString(date = new Date()) {
  return date.toLocaleDateString("en-CA");
}
