import Link from "next/link";
import { ArrowRight, Bell } from "lucide-react";
import { isGoalDueToday } from "@/frontend/lib/goals";
import { formatMoney } from "@/shared/config";
import { sumMoney } from "@/shared/money";
import type { SavingsGoal } from "@/shared/apiTypes";

// Reminder shown when savings installments are scheduled for today
export default function DueCommitmentsBanner({ goals }: { goals: SavingsGoal[] }) {
  const dueGoals = goals.filter((goal) => isGoalDueToday(goal));
  if (dueGoals.length === 0) return null;

  const totalDueAmount = sumMoney(dueGoals.map((g) => g.installment_amount));

  return (
    <div className="mb-6 bg-indigo-600/10 border border-indigo-500/20 backdrop-blur-md rounded-3xl p-4 sm:p-5 flex items-center justify-between group hover:bg-indigo-600/15 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse">
          <Bell size={24} />
        </div>
        <div>
          <h4 className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400">Commitments Due Today</h4>
          <p className="text-xs text-indigo-500/80 font-medium">
            You have {dueGoals.length} savings {dueGoals.length === 1 ? "installment" : "installments"} scheduled ({formatMoney(totalDueAmount)}).
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
  );
}
