import { CornerDownRight } from "lucide-react";
import DeleteButton from "@/frontend/components/atoms/DeleteButton";
import LedgerTypeBadge from "@/frontend/components/atoms/LedgerTypeBadge";
import SignedAmount from "@/frontend/components/atoms/SignedAmount";
import { formatDbDate, transactionDisplayName } from "@/frontend/lib/format";
import type { Transaction } from "@/shared/apiTypes";

type RowProps = {
  transaction: Transaction;
  onDelete: (id: number) => void;
};

// Desktop table row for an entry nested under another transaction
export default function TransactionChildRow({ transaction: t, onDelete }: RowProps) {
  return (
    <div className="grid grid-cols-6 items-center px-5 py-3 pl-10 border-b border-black/[0.03] dark:border-white/[0.03] text-sm text-gray-500 dark:text-zinc-400 bg-white/20 dark:bg-black/20 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <CornerDownRight size={14} className="text-gray-400 dark:text-zinc-500" />
        <span>{transactionDisplayName(t)}</span>
      </div>

      <div className="text-xs">{formatDbDate(t.date)}</div>

      <div>
        <LedgerTypeBadge type={t.type} />
      </div>

      <div className="text-xs truncate">{t.note || "—"}</div>

      <SignedAmount type={t.type} amount={t.amount} className="text-right font-semibold" />

      <div className="flex justify-center items-center">
        {t.is_linked && <DeleteButton onClick={() => onDelete(t.id)} iconSize={14} title="Delete this repayment" />}
      </div>
    </div>
  );
}
