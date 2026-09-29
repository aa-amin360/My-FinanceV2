import ProjectionBlock from "@/frontend/components/molecules/ProjectionBlock";
import { formatMoney } from "@/shared/config";

type BudgetProjectionProps = {
  monthName: string;
  currentBalance: number;
  expectedIncome: number;
  expectedExpenses: number;
  projectedPosition: number;
};

// Current balance + pending plans = projected month-end position
export default function BudgetProjection({
  monthName,
  currentBalance,
  expectedIncome,
  expectedExpenses,
  projectedPosition,
}: BudgetProjectionProps) {
  return (
    <div className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] p-4 sm:p-6 rounded-3xl shadow-sm space-y-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.02)]">
      <h2 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Projections for {monthName}</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 pt-1">
        <div className="col-span-2 sm:col-span-1">
          <ProjectionBlock label="Current Balance" value={currentBalance} color="text-zinc-700 dark:text-zinc-300" />
        </div>
        <ProjectionBlock label="Expected Income" value={expectedIncome} color="text-emerald-500" prefix="+" />
        <ProjectionBlock label="Expected Expenses" value={expectedExpenses} color="text-rose-500" prefix="-" />
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-black/[0.04] dark:border-white/[0.04] mt-2">
        <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-zinc-400">Projected Month-End Position</span>
        <span className="text-base sm:text-xl font-bold text-emerald-500">{formatMoney(projectedPosition)}</span>
      </div>
    </div>
  );
}
