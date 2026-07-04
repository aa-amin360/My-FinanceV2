"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CashflowChart from "@/components/charts/CashflowChart";
import WeeklyChartCard from "@/components/dashboard/WeeklyChartCard";
import Link from "next/link";
import { Trash2, Wallet, Landmark, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { useRefresh } from "@/hooks/useRefresh";

type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
  note: string | null;
  parent_id?: string | null;
  has_child?: boolean;
};

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);
  const [debt, setDebt] = useState(0);
  const [receivable, setReceivable] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ================= LOAD DATA =================
  const loadData = async () => {
    try {
      const [txRes, bRes, dRes, rRes] = await Promise.all([
        fetch("/api/transactions", { cache: "no-store" }),
        fetch("/api/balance", { cache: "no-store" }),
        fetch("/api/debts", { cache: "no-store" }),
        fetch("/api/receivables", { cache: "no-store" }),
      ]);

      const [txData, bData, dData, rData] = await Promise.all([
        txRes.json(),
        bRes.json(),
        dRes.json(),
        rRes.json(),
      ]);

      setTransactions(txData.data || []);
      setBalance(Number(bData.balance || 0));
      setCashBalance(Number(bData.cashBalance || 0));
      setBankBalance(Number(bData.bankBalance || 0));
      setDebt(Number(dData.total || 0));
      setReceivable(Number(rData.total || 0));
    } catch (err) {
      console.error("Failed to load dashboard data in parallel:", err);
    }
  };

  useRefresh(loadData);

  // ================= CALCULATIONS =================
  let income = 0;
  let expense = 0;

  transactions.forEach((t) => {
    const amt = Number(t.amount);
    if (t.type === "INCOME") income += amt;
    if (t.type === "EXPENSE") expense += amt;
  });

  let runningBalance = 0;
  
  // Filter out parents with children to prevent double-counting, leaving only active nodes
  const parentIdsWithChildren = new Set(
    transactions
      .filter((t) => t.parent_id)
      .map((t) => {
        const parent = transactions.find((p) => p.id === t.parent_id);
        if (parent && (parent.type === "DEBT_REPAID" || parent.type === "RECEIVABLE_RECEIVED")) {
          return parent.id;
        }
        return null;
      })
      .filter(Boolean)
  );

  const activeTransactions = transactions.filter(
    (t) => t.parent_id || !parentIdsWithChildren.has(t.id)
  );

  const chartData = activeTransactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t) => {
      const isPositive =
        t.type === "INCOME" ||
        t.type === "DEBT_TAKEN" ||
        t.type === "RECEIVABLE_RECEIVED";
  
      const amount = Number(t.amount);
      runningBalance = isPositive ? runningBalance + amount : runningBalance - amount;
  
      return {
        date: new Date(t.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
        balance: runningBalance,
      };
    });
  
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteId(null);
        window.dispatchEvent(new Event("refreshData"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 pb-12">
        
        {/* ==========================================
            1. HERO BALANCE SUBTLE GREEN GRADIENT CARD
            ========================================== */}
        <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 border shadow-xl transition-all duration-300 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-green-600/10 border-green-500/20 shadow-green-500/[0.03] dark:from-emerald-950/40 dark:via-green-950/20 dark:to-zinc-950/90 dark:border-green-500/15 dark:shadow-green-500/[0.01]">
          {/* Subtle Ambient green blur inside card */}
          <div className="absolute top-[-30%] right-[-10%] w-60 h-60 rounded-full bg-green-500/15 dark:bg-green-500/10 blur-[70px] pointer-events-none" />

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
            {/* Balance Copy */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 leading-none text-green-700/85 dark:text-green-400/80">
                <Activity size={12} className="text-green-600 dark:text-green-400 animate-pulse" /> Ledger Available Balance
              </span>
              
              <h1 className="text-3xl font-extrabold tracking-tight pt-0.5 text-green-800 dark:text-white">
                {Number(balance).toLocaleString("en-BD")} <span className="text-green-600 dark:text-green-400 text-xl font-bold">Tk</span>
              </h1>

              {/* In-Line Account Split (Pt-1.5 shaves off unused vertical height) */}
              <div className="flex gap-4 pt-1.5 text-xs font-semibold font-mono text-green-700/80 dark:text-green-400/70 leading-none">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600/60 dark:bg-green-500/40" /> Cash: {cashBalance.toLocaleString("en-BD")} Tk
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600/60 dark:bg-green-500/40" /> Bank: {bankBalance.toLocaleString("en-BD")} Tk
                </span>
              </div>
            </div>

            {/* Quick Action Link */}
            <Link 
              href="/add-history" 
              className="self-start sm:self-center px-4 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 hover:scale-[1.03] border-green-500/20 bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:border-green-500/15 dark:bg-green-500/5 dark:text-green-300 dark:hover:bg-green-500/10"
            >
              Add History <ArrowUpRight size={13} className="text-green-600 dark:text-green-400" />
            </Link>
          </div>
        </div>
      
        {/* ==========================================
            2. MINIMALIST FINANCIAL METRICS (Simplified - No Icons)
            ========================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Income" value={income} type="income" />
          <MetricCard title="Expenses" value={expense} type="expense" />
          <MetricCard title="Debt" value={debt} type="debt" href="/debts" />
          <MetricCard title="Receivable" value={receivable} type="receivable" href="/receivables" />
        </div>
      
        {/* ==========================================
            3. CHARTS GRID (REPORTS & WEEKLY FLOW)
            ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Area curve chart */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-3xl p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Balance History
            </h3>
            <div className="bg-slate-50/50 dark:bg-[#04070e]/40 border border-slate-100 dark:border-zinc-900/60 rounded-2xl p-2 h-[260px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] dark:shadow-[inset_0_1px_3px_rgba(255,255,255,0.015)]">
              <CashflowChart data={chartData} />
            </div>
          </div>

          {/* Weekly Flow Column Chart */}
          <div className="lg:col-span-5 flex flex-col justify-stretch">
            <WeeklyChartCard />
          </div>
        </div>

        {/* ==========================================
            4. RECENT TRANSACTIONS LEDGER LIST
            ========================================== */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Recent Transactions
            </h3>
            <Link href="/transactions" className="text-xs font-semibold text-green-500 hover:text-green-400 transition">
              See All Transactions →
            </Link>
          </div>

          <div className="space-y-3">
            {[...transactions]
              .filter((t: any) => !t.parent_id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((t) => {
                const amount = Number(t.amount);
                const isPositive =
                  t.type === "INCOME" ||
                  t.type === "DEBT_TAKEN" ||
                  t.type === "RECEIVABLE_RECEIVED";

                const formatType = (type: string) =>
                  type
                    .toLowerCase()
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());

                const capitalize = (text: string) =>
                  text ? text.charAt(0).toUpperCase() + text.slice(1) : "";

                const getDisplayName = (tx: any) => {
                  if (tx.entity_name) return capitalize(tx.entity_name);
                  if (tx.category_name) return capitalize(tx.category_name);
                  return formatType(tx.type);
                };

                return (
                  <div
                    key={t.id}
                    className="
                      bg-white dark:bg-zinc-950
                      border border-slate-200 dark:border-zinc-900
                      rounded-2xl px-5 py-4
                      flex justify-between items-center
                      hover:bg-slate-50 dark:hover:bg-zinc-900/40
                      hover:translate-x-1
                      transition-all duration-200 shadow-sm
                    "
                  >
                    {/* LEFT */}
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="font-semibold text-black dark:text-white text-sm truncate">
                        {getDisplayName(t)}
                      </div>

                      <div className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                        {new Date(t.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className={`font-bold text-base ${isPositive ? "text-green-500" : "text-red-500"}`}>
                          {isPositive ? "+" : "-"}
                          {Number(amount).toLocaleString("en-BD")} Tk
                        </div>

                        <div className="mt-1">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              t.type === "INCOME"
                                ? "bg-green-500/10 text-green-400"
                                : t.type === "EXPENSE"
                                ? "bg-red-500/10 text-red-400"
                                : t.type.includes("DEBT")
                                ? "bg-blue-500/10 text-blue-400"
                                : t.type.includes("RECEIVABLE")
                                ? "bg-yellow-500/10 text-yellow-400"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {formatType(t.type)}
                          </span>
                        </div>
                      </div>

                      {/* Delete Action Trigger */}
                      <button
                        onClick={() => setDeleteId(t.id)}
                        className="p-1.5 rounded-xl text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

      </div>

      {/* ==========================================
          GORGEOUS CUSTOM DELETE CONFIRMATION MODAL
          ========================================== */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white/95 dark:bg-black/90 border border-slate-200 dark:border-zinc-800 backdrop-blur-xl rounded-3xl p-6 w-full max-w-[320px] text-center shadow-2xl flex flex-col gap-4 animate-modalIn" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-black dark:text-white">Delete Transaction?</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to permanently delete this transaction? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center mt-2">
              <button
                onClick={async () => {
                  await handleDelete(deleteId);
                  setDeleteId(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition active:scale-95 shadow-md"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ================= MINIMILIST METRIC CARD COMPONENT =================

const getCardStyle = (type: string) => {
  switch (type) {
    case "income":
      return {
        text: "text-green-600 dark:text-green-400",
        bg: "bg-green-500/15 dark:bg-green-500/10",
        border: "border-green-500/20 dark:border-green-500/15",
      };
    case "expense":
      return {
        text: "text-red-600 dark:text-red-400",
        bg: "bg-red-500/15 dark:bg-red-500/10",
        border: "border-red-500/20 dark:border-red-500/15",
      };
    case "debt":
      return {
        text: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-cyan-500/15 dark:bg-cyan-500/10",
        border: "border-cyan-500/20 dark:border-cyan-500/15",
      };
    case "receivable":
      return {
        text: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-500/15 dark:bg-yellow-500/10",
        border: "border-yellow-500/20 dark:border-yellow-500/15",
      };
    default:
      return {
        text: "text-gray-400",
        bg: "bg-slate-50 dark:bg-zinc-950/40",
        border: "border-slate-200 dark:border-zinc-900/60",
      };
  }
};

function MetricCard({ title, value, type, href }: any) { // Renamed safely & removed Icon destructuring
  const formatted = Number(value).toLocaleString("en-BD");
  const { text, bg, border } = getCardStyle(type);

  const content = (
    <div className={`p-3.5 sm:p-4 rounded-2xl border transition hover:scale-[1.01] duration-200 ${bg} ${border} ${href ? "cursor-pointer" : ""}`}>
      <div className="min-w-0">
        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider block leading-none opacity-85 ${text}`}>
          {title}
        </span>
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className={`font-extrabold leading-none truncate text-sm sm:text-base ${text}`}>
            {formatted}
          </span>
          <span className={`text-[10px] shrink-0 font-bold opacity-80 ${text}`}>
            Tk
          </span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}