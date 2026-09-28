"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRefresh } from "@/hooks/useRefresh";
import { formatMoney } from "@/lib/config";
import { formatName, formatTypeLabel, isInflowType, isLedgerRow } from "@/lib/ledger";
import { subtractMoney, sumMoney } from "@/lib/money";
import { OBLIGATION_CONFIG, ObligationKind, ObligationRow, openSettleModal } from "./config";

type Transaction = {
  id: number;
  type: string;
  amount: string;
  date: string;
  note: string | null;
  entity_name: string | null;
  parent_id: number | null;
  has_child: boolean;
};

export default function ObligationDetailPage({ kind }: { kind: ObligationKind }) {
  const config = OBLIGATION_CONFIG[kind];
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [outstanding, setOutstanding] = useState<ObligationRow | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadData = async () => {
    try {
      const [detailsRes, txRes] = await Promise.all([
        fetch(config.apiPath, { cache: "no-store" }),
        fetch(`/api/transactions?all=true&entityId=${encodeURIComponent(id)}`, { cache: "no-store" }),
      ]);
      const [details, txData] = await Promise.all([detailsRes.json(), txRes.json()]);

      // Route params are strings while ids from the API are numbers
      const row = (details.data || []).find((d: ObligationRow) => String(d.entity_id) === String(id)) || null;
      const rows: Transaction[] = (txData.data || []).filter(
        (t: Transaction) => (t.type === config.originType || t.type === config.settleType) && isLedgerRow(t)
      );

      setOutstanding(row);
      setTransactions(rows);
      setName(row?.name || rows.find((t) => t.entity_name)?.entity_name || "");
    } catch (err) {
      console.error(`Failed to load ${config.detailTitle.toLowerCase()}:`, err);
    }
  };

  useRefresh(loadData);

  const totalOrigin = sumMoney(transactions.filter((t) => t.type === config.originType).map((t) => t.amount));
  const totalSettled = sumMoney(transactions.filter((t) => t.type === config.settleType).map((t) => t.amount));
  // The debts/receivables table is authoritative; it has no row once fully settled
  const remaining = outstanding ? Number(outstanding.remaining_amount) : Math.max(0, subtractMoney(totalOrigin, totalSettled));

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id
  );

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 animate-fadeIn pb-16">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(config.basePath)}
            className="
              p-2 rounded-xl
              bg-black/[0.03] dark:bg-white/[0.03]
              border border-black/[0.04] dark:border-white/[0.04]
              hover:bg-black/[0.06] dark:hover:bg-white/[0.06]
              transition active:scale-95
            "
          >
            <ArrowLeft size={18} className="text-black dark:text-white" />
          </button>

          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            {config.detailTitle}
          </h1>
        </div>

        {/* SUMMARY CARD */}
        <div
          className="
          bg-white/45 dark:bg-black/35
          border border-black/[0.05] dark:border-white/[0.04]
          backdrop-blur-md p-6 rounded-3xl
          shadow-sm shadow-black/[0.01]
          "
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-black dark:text-white leading-none">
              {formatName(name)}
            </h3>

            {name && remaining > 0 && (
              <button
                onClick={() => openSettleModal(config, name)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition active:scale-95 ${config.actionClass}`}
              >
                {config.actionLabel}
              </button>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 dark:text-zinc-500">{config.originLabel}</span>
              <span className="text-black dark:text-white font-semibold">{formatMoney(totalOrigin)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-400 dark:text-zinc-500">{config.settledLabel}</span>
              <span className="text-black dark:text-white font-semibold">{formatMoney(totalSettled)}</span>
            </div>

            <div className="flex justify-between pt-3 border-t border-black/[0.04] dark:border-white/[0.04]">
              <span className="text-slate-500 dark:text-zinc-400 font-bold">Remaining</span>
              <span className={`${config.amountClass} font-extrabold text-lg sm:text-xl`}>
                {formatMoney(remaining)}
              </span>
            </div>
          </div>
        </div>

        {/* TRANSACTIONS LIST */}
        <div className="flex flex-col gap-3">
          {sorted.map((t) => {
            const isInflow = isInflowType(t.type);

            return (
              <div
                key={t.id}
                className="
                flex justify-between items-center
                p-4 rounded-2xl
                bg-white/25 dark:bg-zinc-950/10
                border border-black/[0.03] dark:border-white/[0.03]
                backdrop-blur-sm
                hover:bg-white/35 dark:hover:bg-zinc-950/20
                transition duration-200
                "
              >
                <div>
                  <div className="text-sm font-semibold text-black dark:text-white">
                    {formatTypeLabel(t.type)}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                    {new Date(t.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                    {t.note ? ` · ${t.note}` : ""}
                  </div>
                </div>

                <div className={`font-bold text-base ${isInflow ? "text-emerald-500" : "text-rose-500"}`}>
                  {isInflow ? "+" : "-"}
                  {formatMoney(t.amount)}
                </div>
              </div>
            );
          })}
        </div>

        {transactions.length === 0 && (
          <div className="text-center text-slate-400 dark:text-zinc-500 py-12 text-sm">
            No transactions found
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
