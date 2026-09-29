import { formatTypeLabel } from "@/shared/ledger";

// Color per transaction type on the transactions list
const TYPE_STYLES: Record<string, string> = {
  INCOME: "bg-green-500/20 text-green-500",
  EXPENSE: "bg-red-500/20 text-red-500",
  DEBT_TAKEN: "bg-blue-500/20 text-blue-500",
  DEBT_REPAID: "bg-cyan-500/20 text-cyan-500",
  RECEIVABLE_GIVEN: "bg-yellow-500/20 text-yellow-500",
  RECEIVABLE_RECEIVED: "bg-purple-500/20 text-purple-500",
};
const DEFAULT_STYLE = "bg-gray-500/20 text-gray-400";

type LedgerTypeBadgeProps = {
  type: string;
  // "sm" is the compact mobile variant
  size?: "md" | "sm";
};

// Colored pill naming a transaction type ("Debt Repaid")
export default function LedgerTypeBadge({ type, size = "md" }: LedgerTypeBadgeProps) {
  const style = TYPE_STYLES[type] ?? DEFAULT_STYLE;
  const sizeClass = size === "sm" ? "text-[9px] shrink-0" : "text-[10px]";

  return (
    <span className={`px-2 py-0.5 rounded-full ${sizeClass} font-bold tracking-wide uppercase ${style}`}>
      {formatTypeLabel(type)}
    </span>
  );
}
