import Link from "next/link";
import RecentTransactionItem from "@/frontend/components/molecules/RecentTransactionItem";
import type { Transaction } from "@/shared/apiTypes";

type RecentTransactionsProps = {
  transactions: Transaction[];
  error: string | null;
  onDelete: (id: number) => void;
};

// Latest top-level transactions with a link to the full list
export default function RecentTransactions({ transactions, error, onDelete }: RecentTransactionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Recent Transactions</h3>
        <Link href="/transactions" className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition">
          See All Transactions →
        </Link>
      </div>

      <div className="space-y-3 stagger">
        {error && <div className="text-xs font-semibold text-red-500 px-1">{error}</div>}

        {transactions
          .filter((t) => !t.parent_id)
          .map((t) => (
            <RecentTransactionItem key={t.id} transaction={t} onDelete={onDelete} />
          ))}
      </div>
    </div>
  );
}
