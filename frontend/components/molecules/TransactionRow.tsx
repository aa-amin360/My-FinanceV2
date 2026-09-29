import { ChevronDown, ChevronRight } from "lucide-react";
import DeleteButton from "@/frontend/components/atoms/DeleteButton";
import LedgerTypeBadge from "@/frontend/components/atoms/LedgerTypeBadge";
import SignedAmount from "@/frontend/components/atoms/SignedAmount";
import { formatDbDate, transactionDisplayName } from "@/frontend/lib/format";
import type { Transaction } from "@/shared/apiTypes";

type RowProps = {
  transaction: Transaction;
  onDelete: (id: number) => void;
};

// Desktop table row for a top-level transaction
export default function TransactionRow({
  transaction: t,
  expanded,
  onToggle,
  onDelete,
}: RowProps & { expanded: boolean; onToggle: () => void }) {
  return (
    <div className="grid grid-cols-6 items-center px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.04] text-sm hover:bg-white/35 dark:hover:bg-black/35 transition-all duration-200">
      <div className="font-semibold text-black dark:text-white text-base flex items-center">
        {t.has_child && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="mr-2 cursor-pointer text-gray-400 dark:text-zinc-500"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
        <span>{transactionDisplayName(t)}</span>
      </div>

      <div className="text-xs text-gray-500 dark:text-zinc-500">{formatDbDate(t.date)}</div>

      <div>
        <LedgerTypeBadge type={t.type} />
      </div>

      <div className="text-xs text-gray-500 dark:text-zinc-500 truncate">{t.note || "—"}</div>

      <SignedAmount type={t.type} amount={t.amount} className="text-right font-semibold" />

      <div className="flex justify-center items-center gap-2">
        <DeleteButton onClick={() => onDelete(t.id)} />
      </div>
    </div>
  );
}
