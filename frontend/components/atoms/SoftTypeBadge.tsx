import { formatTypeLabel } from "@/shared/ledger";

function styleFor(type: string) {
  if (type === "INCOME") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (type === "EXPENSE") return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
  if (type.includes("DEBT")) return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
  if (type.includes("RECEIVABLE")) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-zinc-800 text-zinc-400";
}

// Small low-contrast type pill used in compact transaction lists (dashboard, calendar)
export default function SoftTypeBadge({ type }: { type: string }) {
  return (
    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${styleFor(type)}`}>
      {formatTypeLabel(type)}
    </span>
  );
}
