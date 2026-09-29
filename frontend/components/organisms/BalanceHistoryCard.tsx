"use client";

import dynamic from "next/dynamic";
import { Activity } from "lucide-react";
import { formatDbDate } from "@/frontend/lib/format";
import type { Report } from "@/shared/apiTypes";

// Charts render in the browser only
const CashflowChart = dynamic(() => import("@/frontend/components/organisms/CashflowChart"), { ssr: false });

// Cash + Bank balance over the selected report period
export default function BalanceHistoryCard({ trajectory }: { trajectory: Report["trajectory"] }) {
  const chartData = trajectory.map((point) => ({
    date: formatDbDate(point.date, "short"),
    balance: point.balance,
  }));

  return (
    <div className="lg:col-span-8 bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md rounded-3xl p-5 shadow-sm shadow-black/[0.01]">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 leading-none">
        <Activity size={12} className="text-emerald-500" /> Balance History
      </h3>
      <div className="bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.03] dark:border-white/[0.03] rounded-2xl p-2 h-[280px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
        <CashflowChart data={chartData} />
      </div>
    </div>
  );
}
