"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import MetricCard from "@/components/ui/MetricCard";
import dynamic from "next/dynamic";

const CashflowChart = dynamic(() => import("../../components/charts/CashflowChart"), {
  ssr: false,
});

const CategoryDonut = dynamic(() => import("../../components/charts/CategoryDonut"), {
  ssr: false,
});

import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  Activity, 
  PieChart 
} from "lucide-react";

type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
  category_name?: string;
  parent_id?: string | null;
};

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [range, setRange] = useState<"ALL" | "YEAR" | "MONTH">("MONTH");

  // Fetch initial transactions ledger data
  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data.data || []));
  }, []);

  const now = new Date();

  // Filter transactions dynamically based on active filter range state
  const filteredTx = transactions.filter((t) => {
    const date = new Date(t.date);

    if (range === "MONTH") {
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }

    if (range === "YEAR") {
      return date.getFullYear() === now.getFullYear();
    }

    return true;
  });

  // Dynamic calculations for flow metrics
  let income = 0;
  let expense = 0;

  filteredTx.forEach((t) => {
    const amount = Number(t.amount);
    if (t.type === "INCOME") income += amount;
    if (t.type === "EXPENSE") expense += amount;
  });

  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  // Aggregate dynamic expense totals per category for the charts
  const categoryMap: Record<string, number> = {};

  filteredTx.forEach((t) => {
    if (t.type !== "EXPENSE") return;

    const category = t.category_name || "Other";
    const amount = Number(t.amount);

    categoryMap[category] = (categoryMap[category] || 0) + amount;
  });

  const donutData = Object.keys(categoryMap).map((key) => ({
    name: key,
    value: categoryMap[key],
  }));

  const sortedCategories = Object.keys(categoryMap)
    .map((name) => ({ name, value: categoryMap[name] }))
    .sort((a, b) => b.value - a.value);

  // Exclude duplicate parenting entries to keep balance trajectory accurate
  const parentIdsWithChildren = new Set(
    filteredTx
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

  const activeFilteredTx = filteredTx.filter(
    (t) => t.parent_id || !parentIdsWithChildren.has(t.id)
  );

  const chartData = activeFilteredTx
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t, index, arr) => {
      const isPositive =
        t.type === "INCOME" ||
        t.type === "DEBT_TAKEN" ||
        t.type === "RECEIVABLE_RECEIVED";

      const amount = Number(t.amount);

      const prev = index === 0 ? 0 : (arr[index - 1] as any).balance || 0;
      const balance = isPositive ? prev + amount : prev - amount;

      (t as any).balance = balance;

      return {
        date: new Date(t.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        balance,
      };
    });

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 animate-fadeIn pb-16">

        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
              Reports
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-500">Analyze your historical performance and savings efficiency.</p>
          </div>
      
          <div className="flex gap-2 items-center self-end sm:self-center">
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-inner">
              <FilterBtn
                label="All"
                active={range === "ALL"}
                onClick={() => setRange("ALL")}
              />
        
              <FilterBtn
                label="This Year"
                active={range === "YEAR"}
                onClick={() => setRange("YEAR")}
              />
        
              <FilterBtn
                label="This Month"
                active={range === "MONTH"}
                onClick={() => setRange("MONTH")}
              />
            </div>
          </div>
        </div>

        {/* Reusable MetricCard Summaries Row (Completely decoupled and cleaned up) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard title="Total Income" value={income} type="income" icon={ArrowUpRight} />
          <MetricCard title="Total Expense" value={expense} type="expense" icon={ArrowDownRight} />
          <MetricCard title="Net Savings Rate" value={savingsRate} type="savings" icon={Percent} isPercentage={true} />
        </div>
      
        {/* Cohesive Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Balance History Chart */}
          <div className="lg:col-span-8 bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md rounded-3xl p-5 shadow-sm shadow-black/[0.01]">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 leading-none">
              <Activity size={12} className="text-emerald-500" /> Balance History
            </h3>
            <div className="bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.03] dark:border-white/[0.03] rounded-2xl p-2 h-[280px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
              <CashflowChart data={chartData} />
            </div>
          </div>

          {/* Expense Breakdown & Top List */}
          <div className="lg:col-span-4 bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md rounded-3xl p-5 shadow-sm shadow-black/[0.01] flex flex-col justify-between gap-6">
            
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 leading-none">
                <PieChart size={12} className="text-rose-500" /> Expense Breakdown
              </h3>
              <div className="bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.03] dark:border-white/[0.03] rounded-2xl h-[250px] w-full relative overflow-hidden">
                <CategoryDonut data={donutData} />
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-hidden">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Top Spending Sectors</span>
              
              <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                {sortedCategories.slice(0, 3).map((item, idx) => {
                  const percent = expense > 0 ? (item.value / expense) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-black dark:text-white truncate max-w-[120px]">{item.name}</span>
                        <span className="text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                          {item.value.toLocaleString("en-BD")} Tk ({percent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-1 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}

                {sortedCategories.length === 0 && (
                  <div className="text-center text-xs text-slate-400 py-6">No expenses tracked in this period</div>
                )}
              </div>
            </div>

          </div>
      
        </div>
      
      </div>
    </DashboardLayout>
  );
}

// Filter button widget inside page controls
function FilterBtn({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 duration-200 shrink-0 ${
        active
          ? "bg-green-500 text-black shadow-md shadow-green-500/10" 
          : "bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] text-slate-700 dark:text-zinc-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.06]" 
      }`}
    >
      {label}
    </button>
  );
}