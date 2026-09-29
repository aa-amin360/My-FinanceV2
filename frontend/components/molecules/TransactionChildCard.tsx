import { CornerDownRight, Trash2 } from "lucide-react";
import LedgerTypeBadge from "@/frontend/components/atoms/LedgerTypeBadge";
import { formatDbDate, transactionDisplayName } from "@/frontend/lib/format";
import { formatMoney } from "@/shared/config";
import { isInflowType } from "@/shared/ledger";
import type { Transaction } from "@/shared/apiTypes";

type CardProps = {
  transaction: Transaction;
  onDelete: (id: number) => void;
};

// Mobile card for an entry nested under another transaction
export default function TransactionChildCard({ transaction: t, onDelete }: CardProps) {
  const inflow = isInflowType(t.type);

  return (
    <div className="bg-white/5 dark:bg-white/[0.01] border border-black/[0.03] dark:border-white/[0.02] p-3 rounded-xl ml-4 text-gray-500 dark:text-zinc-400 animate-slideDown">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CornerDownRight size={14} className="text-gray-400 dark:text-zinc-500 shrink-0" />
          <span className="text-black dark:text-white truncate font-bold text-xs sm:text-sm">
            {transactionDisplayName(t)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500 dark:text-zinc-500">{formatDbDate(t.date, "short")}</div>
          <span className={`font-semibold whitespace-nowrap text-xs sm:text-sm ${inflow ? "text-emerald-500" : "text-rose-500"}`}>
            {inflow ? "+" : "-"}
            {formatMoney(t.amount)}
            {t.is_linked && (
              <button onClick={() => onDelete(t.id)} title="Delete this repayment" className="ml-2 align-middle text-red-400">
                <Trash2 size={13} />
              </button>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500 dark:text-zinc-500 truncate">{t.note || "No note"}</div>
          <LedgerTypeBadge type={t.type} size="sm" />
        </div>
      </div>
    </div>
  );
}
