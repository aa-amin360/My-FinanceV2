"use client";

import { useState } from "react";
import Pagination from "@/frontend/components/molecules/Pagination";
import TransactionCard from "@/frontend/components/molecules/TransactionCard";
import TransactionChildCard from "@/frontend/components/molecules/TransactionChildCard";
import TransactionChildRow from "@/frontend/components/molecules/TransactionChildRow";
import TransactionRow from "@/frontend/components/molecules/TransactionRow";
import type { Transaction } from "@/shared/apiTypes";

type TransactionListProps = {
  // Top-level rows in display order followed by their children (as the API returns them)
  transactions: Transaction[];
  page: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onDelete: (id: number) => void;
};

// Transactions as a table on desktop and cards on mobile, with expandable
// repayments/splits under each parent and pagination
export default function TransactionList({
  transactions,
  page,
  totalPages,
  loading,
  onPageChange,
  onDelete,
}: TransactionListProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggle = (id: number) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  const roots = transactions.filter((t) => !t.parent_id);
  const childrenOf = (id: number) => transactions.filter((c) => c.parent_id === id);

  return (
    <div className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md rounded-3xl overflow-hidden shadow-sm shadow-black/[0.01]">
      {/* Desktop Table Headers */}
      <div className="hidden md:grid grid-cols-6 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-black/[0.05] dark:border-white/[0.04] leading-none">
        <div>Name</div>
        <div>Date</div>
        <div>Type</div>
        <div>Note</div>
        <div className="text-right">Amount</div>
        <div className="text-center">Actions</div>
      </div>

      <div className="pb-24 md:pb-0">
        {/* Desktop rows */}
        <div className="hidden md:block divide-y divide-slate-100 dark:divide-zinc-900/60">
          {roots.map((parent) => (
            <div key={parent.id}>
              <TransactionRow
                transaction={parent}
                expanded={!!expanded[parent.id]}
                onToggle={() => toggle(parent.id)}
                onDelete={onDelete}
              />
              {expanded[parent.id] &&
                childrenOf(parent.id).map((child) => (
                  <TransactionChildRow key={child.id} transaction={child} onDelete={onDelete} />
                ))}
            </div>
          ))}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3 px-2 py-4">
          {roots.map((parent) => (
            <div key={parent.id} className="space-y-2">
              <TransactionCard
                transaction={parent}
                expanded={!!expanded[parent.id]}
                onToggle={() => toggle(parent.id)}
                onDelete={onDelete}
              />
              {expanded[parent.id] &&
                childrenOf(parent.id).map((child) => (
                  <TransactionChildCard key={child.id} transaction={child} onDelete={onDelete} />
                ))}
            </div>
          ))}
        </div>

        <Pagination page={page} totalPages={totalPages} disabled={loading} onChange={onPageChange} />
      </div>

      {transactions.length === 0 && <div className="p-6 text-center text-gray-400">No transactions yet</div>}
    </div>
  );
}
