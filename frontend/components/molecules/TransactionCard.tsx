import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import LedgerTypeBadge from "@/frontend/components/atoms/LedgerTypeBadge";
import SignedAmount from "@/frontend/components/atoms/SignedAmount";
import { formatDbDate, transactionDisplayName } from "@/frontend/lib/format";
import type { Transaction } from "@/shared/apiTypes";

type CardProps = {
  transaction: Transaction;
  onDelete: (id: number) => void;
};

// Mobile card for a top-level transaction
export default function TransactionCard({
  transaction: t,
  expanded,
  onToggle,
  onDelete,
}: CardProps & { expanded: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white/10 dark:bg-white/[0.01] border border-black/[0.04] dark:border-white/[0.03] p-4 rounded-2xl shadow-sm shadow-black/[0.01]">
      <div className="flex justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            {t.has_child && (
              <button
                onClick={onToggle}
                className="w-6 h-6 rounded-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] flex items-center justify-center text-gray-500 dark:text-zinc-400 shrink-0"
              >
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            <div className="font-bold text-black dark:text-white truncate">{transactionDisplayName(t)}</div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-gray-500 dark:text-zinc-500">{formatDbDate(t.date, "short")}</div>
            <SignedAmount type={t.type} amount={t.amount} className="font-semibold whitespace-nowrap" />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-gray-500 dark:text-zinc-500 truncate">{t.note || "No note"}</div>
            <LedgerTypeBadge type={t.type} size="sm" />
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(t.id);
          }}
          className="w-10 h-10 rounded-full bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-center text-red-400 shrink-0 self-center"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
