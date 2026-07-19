"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useRefresh } from "@/hooks/useRefresh";
import { Calendar, Trash2, Award } from "lucide-react";

type Goal = {
  id: number;
  name: string;
  target_amount: string;
  current_amount: string;
  target_date: string;
  installment_amount: string | null;
  frequency: string;
  reminder_day: number | null;
};

export default function SavingsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [goalToDeleteId, setGoalToDeleteId] = useState<number | null>(null);
  const [goalToAchieveId, setGoalToAchieveId] = useState<number | null>(null);
  const [totalSavings, setTotalSavings] = useState(0);

  // Fetch initial goals and ledger balance
  const loadData = async () => {
    const res = await fetch("/api/savings");
    const json = await res.json();
    setGoals(json.data || []);

    const balRes = await fetch("/api/balance");
    const balJson = await balRes.json();
    setTotalSavings(balJson.savingsTotal || 0);
  };

  useRefresh(loadData);

  const allocatedAmount = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const unallocated = totalSavings - allocatedAmount;

  // Handle goals removal with automatic refund option or converting to Spent expense
  const handleDelete = async (id: number, actionType: "REFUND" | "SPENT") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/savings/${id}?action=${actionType}`, { method: "DELETE" });
      if (res.ok) {
        setGoalToDeleteId(null);
        setGoalToAchieveId(null);
        loadData();
      }
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Dispatch global custom event to trigger transfer inputs in the modular TransactionModal
  const handleAddFunds = (goal: Goal) => {
    window.dispatchEvent(new CustomEvent("openAdd", {
      detail: {
        type: "TRANSFER",
        direction: "TO_SAVINGS",
        goalId: goal.id,
        goalName: goal.name,
        amount: goal.installment_amount
      }
    }));
  };

  // Verify if reminder installment is triggered for today
  const isPaymentDue = (goal: Goal) => {
    if (!goal.reminder_day) return false;
    const today = new Date();
    
    if (goal.frequency === "MONTHLY") {
      return today.getDate() === goal.reminder_day;
    }
    if (goal.frequency === "WEEKLY") {
      return today.getDay() === goal.reminder_day;
    }
    if (goal.frequency === "DAILY") return true;
    return false;
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 animate-fadeIn pb-16">
        
        {/* Header Section: Now clean and minimalist without the duplicated header button */}
        <div className="px-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black dark:text-white truncate">
            Savings Goals
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-500 dark:text-zinc-500 truncate mt-1">
            Assistant & virtual buckets.
          </p>
        </div>

        {/* Savings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Unallocated General Savings Bucket */}
          {unallocated > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 backdrop-blur-md p-6 rounded-[28px] flex flex-col justify-between h-[250px]">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-black dark:text-white">General Savings</h3>
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-lg">Unallocated</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Money stored inside your savings accounts that has not been explicitly assigned to any virtual target goal yet.
                </p>
              </div>
              <div className="pt-4 border-t border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Available Reserve</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {unallocated.toLocaleString()} <span className="text-xs font-bold text-slate-500">Tk</span>
                </div>
              </div>
            </div>
          )}

          {goals.map((goal) => {
            const current = Number(goal.current_amount);
            const target = Number(goal.target_amount);
            const progress = Math.min((current / target) * 100, 100);
            const remaining = Math.max(target - current, 0);
            const dueToday = isPaymentDue(goal);

            // Circular progress SVG configuration parameters
            const radius = 26;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (progress / 100) * circumference;

            return (
              <div 
                key={goal.id} 
                className={`
                  relative overflow-hidden
                  bg-white/60 dark:bg-[#11161d]/50 
                  border ${dueToday ? 'border-indigo-500/60 shadow-[0_0_25px_rgba(99,102,241,0.12)]' : 'border-black/[0.06] dark:border-white/[0.05]'} 
                  backdrop-blur-xl p-6 rounded-[28px] flex flex-col justify-between h-[250px]
                  transition-all duration-300 hover:scale-[1.01] hover:border-black/10 dark:hover:border-white/10
                  animate-modalIn
                `}
              >
                {/* Visual Ambient Glow for due installations */}
                {dueToday && (
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
                )}

                {/* Upper Body: Name and Circle Ring */}
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block leading-none">
                      Savings Target
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-black dark:text-white truncate tracking-tight leading-tight">
                      {goal.name}
                    </h3>
                    
                    <div className="pt-2 flex flex-col gap-0.5">
                      <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block leading-none">Remaining Needed</span>
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                        {remaining === 0 ? "Goal Achieved!" : `${remaining.toLocaleString()} Tk left`}
                      </span>
                    </div>
                  </div>

                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        className="text-black/5 dark:text-white/5 stroke-current"
                        strokeWidth="3.5"
                        fill="transparent"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        className="text-indigo-500 stroke-current transition-all duration-1000 ease-out"
                        strokeWidth="3.5"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                      <span className="text-[11px] font-black text-black dark:text-white">{progress.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Metrics Divider */}
                <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-black/[0.04] dark:border-white/[0.04] text-left">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Saved Balance</span>
                    <span className="text-xs font-black text-black dark:text-white">{current.toLocaleString()} Tk</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Target Cap</span>
                    <span className="text-xs font-black text-black dark:text-white">{target.toLocaleString()} Tk</span>
                  </div>
                </div>

                {/* Action buttons footer */}
                <div className="flex justify-between items-center pt-2">
                   {/* Delete button: pure cancel and refund flow */}
                   <button 
                    onClick={() => setGoalToDeleteId(goal.id)}
                    title="Cancel & Refund Goal"
                    className="p-2 rounded-xl text-slate-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                   >
                    <Trash2 size={15} />
                   </button>

                   <div className="flex gap-2">
                     {current > 0 && (
                       <button
                         onClick={() => setGoalToAchieveId(goal.id)}
                         className="px-3.5 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-black border border-emerald-500/20 transition-all active:scale-95"
                       >
                         Achieve
                       </button>
                     )}

                     <button 
                      onClick={() => handleAddFunds(goal)}
                      className={`
                        px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 active:scale-95
                        ${dueToday 
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 hover:shadow-indigo-500/40' 
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white'
                        }
                      `}
                     >
                      {dueToday ? 'Due Today' : 'Add Funds'}
                     </button>
                   </div>
                </div>
              </div>
            );
          })}
        </div>

        {goals.length === 0 && (
          <div className="p-16 text-center border border-dashed border-black/10 dark:border-white/10 rounded-[40px]">
            <p className="text-slate-400 text-sm">No goals created yet. Set a commitment to start.</p>
          </div>
        )}

        {/* Pure Delete & Cancel Modal */}
        {goalToDeleteId && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setGoalToDeleteId(null)}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[340px] sm:max-w-[400px] bg-white dark:bg-[#0d1318] border border-black/10 dark:border-white/10 rounded-[32px] p-5 sm:p-6 shadow-2xl animate-modalIn relative text-center">
              <h3 className="text-lg font-bold mb-2">Cancel & Delete Goal?</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
                This will remove the goal. All saved funds currently allocated to this goal will be automatically refunded back to your primary accounts (Cash/Bank).
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleDelete(goalToDeleteId, "REFUND")}
                  disabled={loading}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition active:scale-95 text-xs shadow-sm shadow-red-500/10"
                >
                  {loading ? "Refunding..." : "Delete & Refund"}
                </button>
                <button 
                  onClick={() => setGoalToDeleteId(null)}
                  className="flex-1 py-3 bg-black/5 dark:bg-white/5 text-slate-600 dark:text-zinc-400 font-bold rounded-2xl transition text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Triumph State (Achieved) Modal */}
        {goalToAchieveId && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setGoalToAchieveId(null)}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[360px] bg-white dark:bg-[#0d1318] border border-black/10 dark:border-white/10 rounded-[32px] p-6 shadow-2xl animate-modalIn relative text-center flex flex-col gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                <Award size={24} />
              </div>
              
              <h3 className="text-lg font-bold text-black dark:text-white">Congratulations!</h3>
              
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-1">
                Are you ready to mark this goal as achieved and spent?
              </p>

              <div className="p-3 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl text-left">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 text-center">Ledger Reconciliation</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  This will automatically convert your total saved balance for this goal into an <b>EXPENSE</b> transaction on your ledger, ensuring your cash flow and net worth remain completely balanced.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleDelete(goalToAchieveId, "SPENT")}
                  disabled={loading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold rounded-2xl transition active:scale-95 text-xs shadow-md shadow-emerald-500/10"
                >
                  {loading ? "Reconciling Ledger..." : "Yes, Mark as Achieved & Spent"}
                </button>
                
                <button 
                  onClick={() => setGoalToAchieveId(null)}
                  className="w-full py-3 bg-black/5 dark:bg-white/5 text-slate-600 dark:text-zinc-400 font-bold rounded-2xl transition text-xs"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        )}

        </div>
      </DashboardLayout>
    );
  }