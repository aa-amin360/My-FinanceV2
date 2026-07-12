"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useRefresh } from "@/hooks/useRefresh";
import { Target, Plus, X, Calendar, Save, Loader2, TrendingUp, Bell, AlertCircle, ChevronDown, Trash2 } from "lucide-react";

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [goalToDeleteId, setGoalToDeleteId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/savings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGoalToDeleteId(null);
        loadData();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Form State
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  
  // Assistant Form State
  const [installment, setInstallment] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [reminderDay, setReminderDay] = useState("1");
  const [showFreqDropdown, setShowFreqDropdown] = useState(false);
  const freqRef = useRef<HTMLDivElement | null>(null);

  // ✅ Advanced Assistant Forecast Logic
  const getForecast = () => {
    const total = Number(targetAmount);
    const inst = Number(installment);
    if (!total || !inst || inst <= 0) return null;
    
    const cycles = Math.ceil(total / inst);
    const projectedDate = new Date();

    if (frequency === "MONTHLY") {
      projectedDate.setMonth(projectedDate.getMonth() + cycles);
      return { text: `${cycles} Months`, date: projectedDate };
    }
    if (frequency === "WEEKLY") {
      projectedDate.setDate(projectedDate.getDate() + (cycles * 7));
      return { text: `${cycles} Weeks`, date: projectedDate };
    }
    if (frequency === "DAILY") {
      projectedDate.setDate(projectedDate.getDate() + cycles);
      return { text: `${cycles} Days`, date: projectedDate };
    }
    return null;
  };

  const forecast = getForecast();

  // ✅ Auto-set the Date based on the forecast
  useEffect(() => {
    if (forecast?.date) {
      // Formats the date to YYYY-MM-DD for the input field
      const dateString = forecast.date.toISOString().split('T')[0];
      setTargetDate(dateString);
    }
  }, [targetAmount, installment, frequency]);

  const loadData = async () => {
    const res = await fetch("/api/savings");
    const json = await res.json();
    setGoals(json.data || []);
  };

  const closeAddModal = () => {
    resetForm();
    setShowAddModal(false);
  };

  // Click outside detector
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (freqRef.current && !freqRef.current.contains(e.target as Node)) setShowFreqDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useRefresh(loadData);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          target_amount: targetAmount, 
          target_date: targetDate,
          installment_amount: installment,
          frequency,
          reminder_day: reminderDay
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(""); setTargetAmount(""); setTargetDate("");
    setInstallment(""); setFrequency("MONTHLY"); setReminderDay("1");
  };

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

  // ==========================================
  // ASSISTANT NOTIFICATION LOGIC
  // ==========================================
  const isPaymentDue = (goal: Goal) => {
    if (!goal.reminder_day) return false;
    const today = new Date();
    
    if (goal.frequency === "MONTHLY") {
      return today.getDate() === goal.reminder_day;
    }
    if (goal.frequency === "WEEKLY") {
      // 0 = Sunday, 1 = Monday...
      return today.getDay() === goal.reminder_day;
    }
    if (goal.frequency === "DAILY") return true;
    return false;
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 animate-fadeIn pb-16">
        
        <div className="flex justify-between items-center px-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Savings Goals</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-500">Your smart savings assistant and virtual buckets.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs sm:text-sm transition active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Plus size={16} /> New Goal
          </button>
        </div>

        {/* GOALS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const current = Number(goal.current_amount);
            const target = Number(goal.target_amount);
            const progress = Math.min((current / target) * 100, 100);
            const dueToday = isPaymentDue(goal);

            return (
              <div 
                key={goal.id} 
                className={`
                  bg-white/45 dark:bg-black/35 
                  border ${dueToday ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'border-black/[0.05] dark:border-white/[0.04]'} 
                  backdrop-blur-md p-6 rounded-[32px] space-y-5 animate-modalIn transition-all duration-300
                `}
              >
                {/* TOP ROW: NAME & COMMITMENT */}
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-black dark:text-white truncate tracking-tight">
                      {goal.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                       <Calendar size={12} className="text-slate-400" />
                       <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                         Target: {new Date(goal.target_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                       </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {goal.installment_amount && (
                      <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">
                        {Number(goal.installment_amount).toLocaleString()} Tk
                      </div>
                    )}
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                      {goal.frequency} Commit
                    </span>
                  </div>
                </div>

                {/* MIDDLE ROW: PROGRESS NUMBERS */}
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-1.5">
                      {/* ✅ font-normal: Deposited amount is now regular weight */}
                      <span className="text-2xl font-normal text-black dark:text-white leading-none">
                        {current.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        / {target.toLocaleString()} Tk
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xl font-black text-indigo-500 leading-none">
                      {progress.toFixed(0)}%
                    </span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Complete</p>
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="h-2.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/[0.03] dark:border-white/[0.03]">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${dueToday ? 'bg-indigo-400 animate-pulse' : 'bg-indigo-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* BOTTOM ROW: ACTIONS */}
                <div className="flex justify-between items-center pt-2">
                   <button 
                    onClick={() => setGoalToDeleteId(goal.id)}
                    className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                   >
                    <Trash2 size={16} />
                   </button>

                   {/* ✅ Added hover and color change effect */}
                   <button 
                    onClick={() => handleAddFunds(goal)}
                    className={`
                      px-6 py-2 rounded-2xl text-xs font-bold transition-all duration-300 active:scale-95
                      ${dueToday 
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 hover:shadow-indigo-500/40' 
                        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white'
                      }
                    `}
                   >
                    {dueToday ? 'Deposit Due Today' : 'Add Funds'}
                   </button>
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

        {/* NEW GOAL MODAL - REFINED COMPACT SIZE */}
        {showAddModal && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={closeAddModal}>
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[340px] sm:max-w-[400px] bg-white dark:bg-[#0d1318] border border-black/10 dark:border-white/10 rounded-[32px] p-5 sm:p-6 shadow-2xl animate-modalIn relative"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg font-bold text-black dark:text-white leading-none">Setup Commitment</h3>
                <button onClick={closeAddModal} className="p-1.5 bg-black/5 dark:bg-white/5 rounded-full text-slate-400 hover:scale-110 transition">
                  <X size={16}/>
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3 sm:space-y-4">
                
                {/* Goal Name */}
                <div className="space-y-1">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Goal Name</label>
                  <input required placeholder="e.g. New Laptop" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl sm:rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] outline-none focus:bg-white dark:focus:bg-black transition-all text-xs sm:text-sm" />
                </div>

                {/* Target & Date Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Target (Tk)</label>
                    <input required type="number" placeholder="50000" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] outline-none text-xs sm:text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">End Date</label>
                    <input required type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] outline-none text-xs sm:text-sm color-scheme-dark" />
                  </div>
                </div>

                {/* Assistant Section - Compact Widget Style */}
                <div className="p-3 sm:p-4 rounded-2xl bg-indigo-500/[0.03] border border-indigo-500/10 space-y-3">
                  <p className="text-[8px] sm:text-[9px] font-black text-indigo-500/80 uppercase tracking-widest text-center">Commitment Settings</p>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Cycle Amount</label>
                    <input type="number" placeholder="5000" value={installment} onChange={(e) => setInstallment(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-white dark:bg-black border border-indigo-500/20 outline-none text-xs sm:text-sm font-medium" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 relative" ref={freqRef}>
                      <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Frequency</label>
                      <div onClick={() => setShowFreqDropdown(!showFreqDropdown)} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black border border-indigo-500/20 text-xs font-bold flex justify-between items-center cursor-pointer">
                        <span className="truncate">{frequency}</span>
                        <ChevronDown size={12} className="text-indigo-500" />
                      </div>
                      {showFreqDropdown && (
                        <div className="absolute bottom-full left-0 w-full mb-2 p-1 bg-white/95 dark:bg-[#161b22] backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-2xl z-[110] animate-modalIn">
                          {['DAILY', 'WEEKLY', 'MONTHLY'].map((opt) => (
                            <button key={opt} type="button" onClick={() => { setFrequency(opt); setShowFreqDropdown(false); }} className={`w-full text-left px-3 py-2 text-[10px] font-bold rounded-lg transition ${frequency === opt ? 'bg-indigo-500 text-white' : 'text-slate-600 dark:text-zinc-400 hover:bg-black/5'}`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
                        {frequency === 'MONTHLY' ? 'Date' : 'Day'}
                      </label>
                      <input type="number" min="0" max="31" value={reminderDay} onChange={(e) => setReminderDay(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black border border-indigo-500/20 outline-none text-xs font-bold text-indigo-500" />
                    </div>
                  </div>
                </div>

                {/* Assistant Forecast - Slim Version */}
                {forecast && (
                  <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-center animate-fadeIn">
                    <p className="text-[10px] sm:text-xs font-bold text-black dark:text-white leading-none">
                      Approx <span className="text-indigo-500">{forecast.text}</span> to reach goal
                    </p>
                  </div>
                )}

                <button disabled={loading} className="w-full py-3 sm:py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl sm:rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16}/>}
                  {loading ? "Saving..." : "Start Assistant"}
                </button>
              </form>
            </div>
          </div>
        )}

      {/* DELETE CONFIRMATION MODAL */}
      {goalToDeleteId && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setGoalToDeleteId(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[320px] bg-white dark:bg-[#0d1318] border border-black/10 dark:border-white/10 rounded-[32px] p-6 text-center shadow-2xl animate-modalIn"
          >
            <h3 className="text-lg font-bold mb-2">Remove Goal?</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
              This will stop the assistant and remove the bucket. Any money already saved in your ledger will remain in your balance.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => handleDelete(goalToDeleteId)}
                disabled={loading}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition active:scale-95 text-xs"
              >
                {loading ? "Removing..." : "Delete Goal"}
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

      </div>
    </DashboardLayout>
  );
}