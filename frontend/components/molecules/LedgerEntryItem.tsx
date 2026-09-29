import SignedAmount from "@/frontend/components/atoms/SignedAmount";
import { formatDbDate } from "@/frontend/lib/format";
import { formatTypeLabel } from "@/shared/ledger";
import type { Transaction } from "@/shared/apiTypes";

// One debt/receivable movement: type, date, note and signed amount
export default function LedgerEntryItem({ transaction: t }: { transaction: Transaction }) {
  return (
    <div className="flex justify-between items-center p-4 rounded-2xl bg-white/25 dark:bg-zinc-950/10 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm hover:bg-white/35 dark:hover:bg-zinc-950/20 transition duration-200">
      <div>
        <div className="text-sm font-semibold text-black dark:text-white">{formatTypeLabel(t.type)}</div>
        <div className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
          {formatDbDate(t.date)}
          {t.note ? ` · ${t.note}` : ""}
        </div>
      </div>

      <SignedAmount type={t.type} amount={t.amount} className="font-bold text-base" />
    </div>
  );
}
