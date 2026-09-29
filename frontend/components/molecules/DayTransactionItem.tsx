import SignedAmount from "@/frontend/components/atoms/SignedAmount";
import SoftTypeBadge from "@/frontend/components/atoms/SoftTypeBadge";
import { transactionDisplayName } from "@/frontend/lib/format";
import type { Transaction } from "@/shared/apiTypes";

// Transaction row in the calendar's single-day view
export default function DayTransactionItem({ transaction: t }: { transaction: Transaction }) {
  return (
    <div className="bg-white/25 dark:bg-zinc-950/10 border border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 flex justify-between items-center hover:bg-white/35 dark:hover:bg-zinc-950/20 transition-all duration-200 shadow-sm">
      <div className="min-w-0 flex-1 pr-4">
        <div className="font-semibold text-sm sm:text-base text-black dark:text-white truncate">{transactionDisplayName(t)}</div>
        <div className="text-[11px] sm:text-xs text-gray-500 dark:text-zinc-500 mt-1 truncate">{t.note || "No note added"}</div>
      </div>

      <div className="text-right shrink-0 flex items-center gap-4">
        <div className="text-right">
          <SignedAmount type={t.type} amount={t.amount} className="font-bold text-sm sm:text-base" />
          <div className="mt-1">
            <SoftTypeBadge type={t.type} />
          </div>
        </div>
      </div>
    </div>
  );
}
