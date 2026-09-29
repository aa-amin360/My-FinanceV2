import { Trash2 } from "lucide-react";
import ProgressRing from "@/frontend/components/atoms/ProgressRing";
import { isGoalDueToday } from "@/frontend/lib/goals";
import { formatMoney } from "@/shared/config";
import type { SavingsGoal } from "@/shared/apiTypes";

type GoalCardProps = {
  goal: SavingsGoal;
  onDelete: (goal: SavingsGoal) => void;
  onAchieve: (goal: SavingsGoal) => void;
  onAddFunds: (goal: SavingsGoal) => void;
};

// Savings goal with progress ring, amounts and actions; highlighted when an installment is due
export default function GoalCard({ goal, onDelete, onAchieve, onAddFunds }: GoalCardProps) {
  const current = Number(goal.current_amount);
  const target = Number(goal.target_amount);
  const progress = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);
  const dueToday = isGoalDueToday(goal);

  const border = dueToday
    ? "border-indigo-500/60 shadow-[0_0_25px_rgba(99,102,241,0.12)]"
    : "border-black/[0.06] dark:border-white/[0.05]";
  const fundsButton = dueToday
    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 hover:shadow-indigo-500/40"
    : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white";

  return (
    <div
      className={`relative overflow-hidden bg-white/60 dark:bg-[#11161d]/50 border ${border} backdrop-blur-xl p-6 rounded-[28px] flex flex-col justify-between h-[250px] transition-all duration-300 hover:scale-[1.01] hover:border-black/10 dark:hover:border-white/10`}
    >
      {dueToday && <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />}

      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block leading-none">Savings Target</span>
          <h3 className="text-base sm:text-lg font-black text-black dark:text-white truncate tracking-tight leading-tight">{goal.name}</h3>

          <div className="pt-2 flex flex-col gap-0.5">
            <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block leading-none">Remaining Needed</span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {remaining === 0 ? "Goal Achieved!" : `${formatMoney(remaining)} left`}
            </span>
          </div>
        </div>

        <ProgressRing progress={progress} />
      </div>

      <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-black/[0.04] dark:border-white/[0.04] text-left">
        <div>
          <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Saved Balance</span>
          <span className="text-xs font-black text-black dark:text-white">{formatMoney(current)}</span>
        </div>
        <div>
          <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Target Cap</span>
          <span className="text-xs font-black text-black dark:text-white">{formatMoney(target)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => onDelete(goal)}
          title="Cancel & Refund Goal"
          className="p-2 rounded-xl text-slate-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
        >
          <Trash2 size={15} />
        </button>

        <div className="flex gap-2">
          {current > 0 && (
            <button
              onClick={() => onAchieve(goal)}
              className="px-3.5 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-black border border-emerald-500/20 transition-all active:scale-95"
            >
              Achieve
            </button>
          )}

          <button
            onClick={() => onAddFunds(goal)}
            className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 active:scale-95 ${fundsButton}`}
          >
            {dueToday ? "Due Today" : "Add Funds"}
          </button>
        </div>
      </div>
    </div>
  );
}
