import { formatName, formatTypeLabel } from "@/shared/ledger";

// Postgres DATE values arrive as "YYYY-MM-DD" and are parsed as UTC midnight,
// so they are always formatted in UTC to show the stored calendar day.
const DATE_PRESETS = {
  // "Mon, Sep 28, 2026"
  full: { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" },
  // "Sep 28"
  short: { month: "short", day: "numeric", timeZone: "UTC" },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

export type DatePreset = keyof typeof DATE_PRESETS;

export function formatDbDate(date: string, preset: DatePreset = "full") {
  return new Date(date).toLocaleDateString("en-US", DATE_PRESETS[preset]);
}

// "September 2026" for a local Date (month pickers, headers)
export function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

type NamedTransaction = {
  type: string;
  parent_id?: number | null;
  entity_name?: string | null;
  category_name?: string | null;
};

// Label shown for a transaction row: the counterparty, else the category, else the type
export function transactionDisplayName(t: NamedTransaction) {
  if (t.parent_id && t.type === "RECEIVABLE_GIVEN") return "Overpaid → now receivable";
  if (t.parent_id && t.type === "DEBT_TAKEN") return "Over-collected → now debt";
  if (t.entity_name) return formatName(t.entity_name);
  if (t.category_name) return formatName(t.category_name);
  return formatTypeLabel(t.type);
}

// Short amount for tight spaces: 1500 -> "1.5K", 250000 -> "250K"
export function formatCompact(num: number) {
  if (num >= 100000) return (num / 1000).toFixed(0) + "K";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}
