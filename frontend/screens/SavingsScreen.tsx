"use client";

import { useState } from "react";
import GeneralSavingsCard from "@/frontend/components/molecules/GeneralSavingsCard";
import AchieveGoalDialog from "@/frontend/components/organisms/AchieveGoalDialog";
import GoalCard from "@/frontend/components/organisms/GoalCard";
import RefundGoalDialog from "@/frontend/components/organisms/RefundGoalDialog";
import { useRefresh } from "@/frontend/hooks/useRefresh";
import { balanceApi } from "@/frontend/api/balance";
import { errorMessage } from "@/frontend/api/client";
import { savingsApi } from "@/frontend/api/savings";
import { openTransactionModal, requestRefresh } from "@/frontend/lib/events";
import { localDateString } from "@/shared/config";
import { subtractMoney, sumMoney } from "@/shared/money";
import type { SavingsGoal } from "@/shared/apiTypes";
import Presence from "@/frontend/components/atoms/Presence";

export default function SavingsScreen() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [goalToDeleteId, setGoalToDeleteId] = useState<number | null>(null);
  const [goalToAchieveId, setGoalToAchieveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadData = async () => {
    try {
      const [goalList, balances] = await Promise.all([savingsApi.list(), balanceApi.get()]);
      setGoals(goalList);
      setTotalSavings(balances.savingsTotal);
    } catch (err) {
      console.error("Failed to load savings:", err);
    } finally {
      setLoaded(true);
    }
  };

  useRefresh(loadData);

  // Savings in the Savings account that no goal claims
  const unallocated = subtractMoney(totalSavings, sumMoney(goals.map((g) => g.current_amount)));

  // REFUND returns the money to Cash/Bank; SPENT records it as an expense
  const removeGoal = async (id: number, action: "REFUND" | "SPENT") => {
    setLoading(true);
    try {
      await savingsApi.remove(id, action, localDateString());
      setError(null);
      requestRefresh();
    } catch (err) {
      setError(errorMessage(err, "Could not update this goal."));
    } finally {
      setGoalToDeleteId(null);
      setGoalToAchieveId(null);
      setLoading(false);
    }
  };

  const addFunds = (goal: SavingsGoal) =>
    openTransactionModal({
      type: "TRANSFER",
      direction: "TO_SAVINGS",
      goalId: goal.id,
      goalName: goal.name,
      amount: goal.installment_amount,
    });

  return (
    <>
      <div className="w-full space-y-6 pb-16">
        <div className="px-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black dark:text-white truncate">Savings Goals</h1>
          <p className="text-[11px] sm:text-sm text-slate-500 dark:text-zinc-500 truncate mt-1">Assistant & virtual buckets.</p>
        </div>

        {error && <div className="text-sm font-semibold text-red-500 px-1">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
          {unallocated > 0 && <GeneralSavingsCard amount={unallocated} />}

          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={(g) => setGoalToDeleteId(g.id)}
              onAchieve={(g) => setGoalToAchieveId(g.id)}
              onAddFunds={addFunds}
            />
          ))}
        </div>

        {loaded && goals.length === 0 && (
          <div className="animate-fadeIn p-16 text-center border border-dashed border-black/10 dark:border-white/10 rounded-[40px]">
            <p className="text-slate-400 text-sm">No goals created yet. Set a commitment to start.</p>
          </div>
        )}

        <Presence show={!!goalToDeleteId}>
          {goalToDeleteId && (
            <RefundGoalDialog
              loading={loading}
              onConfirm={() => removeGoal(goalToDeleteId, "REFUND")}
              onClose={() => setGoalToDeleteId(null)}
            />
          )}
        </Presence>

        <Presence show={!!goalToAchieveId}>
          {goalToAchieveId && (
            <AchieveGoalDialog
              loading={loading}
              onConfirm={() => removeGoal(goalToAchieveId, "SPENT")}
              onClose={() => setGoalToAchieveId(null)}
            />
          )}
        </Presence>
      </div>
    </>
  );
}
