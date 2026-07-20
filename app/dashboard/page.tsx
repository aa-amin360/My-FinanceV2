"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CashflowChart from "@/components/charts/CashflowChart";
import WeeklyChartCard from "@/components/dashboard/WeeklyChartCard";
import SavingsMonoliths from "@/components/dashboard/SavingsMonoliths";
import SavingsVault from "@/components/dashboard/SavingsVault";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import MetricCard from "@/components/ui/MetricCard";
import Link from "next/link";
import { Trash2, ArrowUpRight, ArrowRight, Bell } from "lucide-react";
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

type Goal = {
  id: number;
  name: string;
  target_amount: string;
  current_amount: string; 
  installment_amount: string | null;
  frequency: string;
  reminder_day: number | null;
};

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);
  const [debt, setDebt] = useState(0);
  const [receivable, setReceivable] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

  const year = currentDate().getFullYear();
  const month = currentDate().getMonth() + 1;

  function currentDate() {
    return new Date();
  }

  // Load all dashboard metrics and transactions in parallel
  const loadData = async () => {
    try {
      const [txRes, bRes, dRes, rRes, gRes] = await Promise.all([
        fetch("/api/transactions", { cache: "no-store" }),
        fetch("/api/balance", { cache: "no-store" }),
        fetch("/api/debts", { cache: "no-store" }),
        fetch("/api/receivables", { cache: "no-store" }),
        fetch("/api/savings", { cache: "no-store" }),
      ]);

      const [txData, bData, dData, rData, gData] = await Promise.all([
        txRes.json(),
        bRes.json(),
        dRes.json(),
        rRes.json(),
        gRes.json(),
      ]);

      setTransactions(txData.data || []);
      setBalance(Number(bData.balance || 0));
      setCashBalance(Number(bData.cashBalance || 0));
      setBankBalance(Number(bData.bankBalance || 0));
      setDebt(Number(dData.total || 0));
      setReceivable(Number(rData.total || 0));
      setGoals(gData.data || []);
    } catch (err) {
      console.error("Failed to load dashboard data in parallel:", err);
    }
  };

  useRefresh(loadData);

  useEffect(() => {
    loadData();
  }, []);

  // Dynamic calculations for overall flow metrics
  let income = 0;
  let expense = 0;

  transactions.forEach((t) => {
    const amt = Number(t.amount);
    if (t.type === "INCOME") income += amt;
    if (t.type === "EXPENSE") expense += amt;
  });

  let runningBalance = 0;
  
  // Exclude duplicate parenting entries to keep balance trajectory accurate
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
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteId(null);
        window.dispatchEvent(new Event("refreshData"));
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Identify savings installments due for today
  const dueGoals = goals.filter((goal) => {
    if (!goal.reminder_day) return false;
    const today = new Date();
    if (goal.frequency === "MONTHLY") return today.getDate() === goal.reminder_day;
    if (goal.frequency === "WEEKLY") return today.getDay() === goal.reminder_day;
    if (goal.frequency === "DAILY") return true;
    return false;
  });

  const totalDueAmount = dueGoals.reduce((sum, g) => sum + Number(g.installment_amount || 0), 0);

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 pb-12 animate-fadeIn">

        {/* Assistant Notification banner */}
        {dueGoals.length > 0 && (
          <div className="mb-6 bg-indigo-600/10 border border-indigo-500/20 backdrop-blur-md rounded-3xl p-4 sm:p-5 flex items-center justify-between group hover:bg-indigo-600/15 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse">
                <Bell size={24} />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400">Commitments Due Today</h4>
                <p className="text-xs text-indigo-500/80 font-medium">
                  You have {dueGoals.length} savings {dueGoals.length === 1 ? 'installment' : 'installments'} scheduled ({totalDueAmount.toLocaleString()} Tk).
                </p>
              </div>
            </div>
            <Link 
              href="/savings" 
              className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-indigo-400 transition active:scale-95 shadow-md shadow-indigo-500/10"
            >
              Deposit <ArrowRight size={14} />
            </Link>
          </div>
        )}
             
        {/* Hero balance glass card */}
        <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 border shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-600/10 border-emerald-500/20 shadow-emerald-500/[0.03] dark:from-emerald-950/20 dark:via-emerald-950/15 dark:to-zinc-950/40 dark:border-emerald-500/15 dark:backdrop-blur-md">
          <div className="absolute top-[-30%] right-[-10%] w-60 h-60 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 blur-[70px] pointer-events-none" />

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none text-emerald-700/85 dark:text-emerald-400/80">
                Ledger Available Balance
              </span>
              
              <h1 className="text-3xl font-extrabold tracking-tight pt-0.5 text-emerald-800 dark:text-white">
                {Number(balance).toLocaleString("en-BD")} <span className="text-emerald-600 dark:text-emerald-400 text-xl font-bold">Tk</span>
              </h1>

              <div className="flex gap-4 pt-1.5 text-xs font-semibold font-mono text-emerald-700/80 dark:text-emerald-400/70 leading-none">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/60 dark:bg-emerald-500/40" /> Cash: {cashBalance.toLocaleString("en-BD")} Tk
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/60 dark:bg-emerald-500/40" /> Bank: {bankBalance.toLocaleString("en-BD")} Tk
                </span>
              </div>
            </div>

            <Link 
              href="/add-history" 
              className="self-start sm:self-center px-4 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 hover:scale-[1.03] border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-500/15 dark:bg-emerald-500/5 dark:text-green-300 dark:hover:bg-emerald-500/10"
            >
              Add History <ArrowUpRight size={13} className="text-emerald-600 dark:text-emerald-400" />
            </Link>
          </div>
        </div>        
      
        {/* Reusable MetricCard Summaries Row (Completely decoupled and cleaned up) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Income" value={income} type="income" />
          <MetricCard title="Expenses" value={expense} type="expense" />
          <MetricCard title="Debt" value={debt} type="debt" href="/debts" />
          <MetricCard title="Receivable" value={receivable} type="receivable" href="/receivables" />
        </div>
      
        {/* Savings Vault Visual Grid */}
        <SavingsVault goals={goals} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">          
          <div className="lg:col-span-8 bg-white/45 dark:bg-black/30 border border-black/[0.05] dark:border-white/[0.05] backdrop-blur-md rounded-3xl p-5 shadow-sm">
            <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
              Balance Trajectory
            </h3>
            <div className="h-[280px]">
              <CashflowChart data={chartData} />
            </div>
          </div>

          <div className="lg:col-span-4">
            <SavingsMonoliths goals={goals} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
           <WeeklyChartCard />
        </div>

        {/* Recent Transactions List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Recent Transactions
            </h3>
            <Link href="/transactions" className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition">
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

                const formatType = (typeStr: string) =>
                  typeStr
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
                      bg-white/25 dark:bg-black/20
                      border border-black/[0.04] dark:border-white/[0.04]
                      backdrop-blur-sm
                      rounded-2xl px-5 py-4
                      flex justify-between items-center
                      hover:bg-white/35 dark:hover:bg-black/35
                      hover:translate-x-1
                      transition-all duration-200 shadow-sm
                    "
                  >
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

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className={`font-bold text-base ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                          {isPositive ? "+" : "-"}
                          {Number(amount).toLocaleString("en-BD")} Tk
                        </div>

                        <div className="mt-1">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              t.type === "INCOME"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : t.type === "EXPENSE"
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : t.type.includes("DEBT")
                                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                : t.type.includes("RECEIVABLE")
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {formatType(t.type)}
                          </span>
                        </div>
                      </div>

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

      {/* Global ConfirmDialog for transactions deletion */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Transaction?"
        description="Are you sure you want to permanently delete this transaction? This action cannot be undone."
        confirmText="Delete"
        loading={loading}
        variant="danger"
      />
    </DashboardLayout>
  );
}