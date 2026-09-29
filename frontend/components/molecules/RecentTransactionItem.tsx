import { Trash2 } from "lucide-react";
import SignedAmount from "@/frontend/components/atoms/SignedAmount";
import SoftTypeBadge from "@/frontend/components/atoms/SoftTypeBadge";
import { formatDbDate, transactionDisplayName } from "@/frontend/lib/format";
import type { Transaction } from "@/shared/apiTypes";

type RecentTransactionItemProps = {
  transaction: Transaction;
  onDelete: (id: number) => void;
};

// Compact transaction row on the dashboard
export default function RecentTransactionItem({ transaction: t, onDelete }: RecentTransactionItemProps) {
  return (
    <div className="bg-white/25 dark:bg-black/20 border border-black/[0.04] dark:border-white/[0.04] backdrop-blur-sm rounded-2xl px-5 py-4 flex justify-between items-center hover:bg-white/35 dark:hover:bg-black/35 hover:translate-x-1 transition-all duration-200 shadow-sm">
      <div className="min-w-0 flex-1 pr-4">
        <div className="font-semibold text-black dark:text-white text-sm truncate">{transactionDisplayName(t)}</div>
        <div className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{formatDbDate(t.date)}</div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <SignedAmount type={t.type} amount={t.amount} className="font-bold text-base" />
          <div className="mt-1">
            <SoftTypeBadge type={t.type} />
          </div>
        </div>

        <button onClick={() => onDelete(t.id)} className="p-1.5 rounded-xl text-red-400 hover:bg-red-500/10 transition">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
