"use client";

import dynamic from "next/dynamic";
import { PieChart } from "lucide-react";
import SpendingBar from "@/frontend/components/molecules/SpendingBar";
import type { Report } from "@/shared/apiTypes";

// Charts render in the browser only
const CategoryDonut = dynamic(() => import("@/frontend/components/organisms/CategoryDonut"), { ssr: false });

type ExpenseBreakdownCardProps = {
  categories: Report["categories"];
  totalExpense: number;
};

// Donut of spending by category plus the top three categories
export default function ExpenseBreakdownCard({ categories, totalExpense }: ExpenseBreakdownCardProps) {
  const top = [...categories].sort((a, b) => b.value - a.value);

  return (
    <div className="lg:col-span-4 bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md rounded-3xl p-5 shadow-sm shadow-black/[0.01] flex flex-col justify-between gap-6">
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 leading-none">
          <PieChart size={12} className="text-rose-500" /> Expense Breakdown
        </h3>
        <div className="bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.03] dark:border-white/[0.03] rounded-2xl h-[250px] w-full relative overflow-hidden">
          <CategoryDonut data={categories} />
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-hidden">
        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Top Spending Sectors</span>

        <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
          {top.slice(0, 3).map((item) => (
            <SpendingBar
              key={item.name}
              name={item.name}
              value={item.value}
              percent={totalExpense > 0 ? (item.value / totalExpense) * 100 : 0}
            />
          ))}

          {top.length === 0 && <div className="text-center text-xs text-slate-400 py-6">No expenses tracked in this period</div>}
        </div>
      </div>
    </div>
  );
}
