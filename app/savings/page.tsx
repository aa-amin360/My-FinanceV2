"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useRefresh } from "@/hooks/useRefresh";
import { Target, Plus, X, Calendar, Save, Loader2, TrendingUp, Bell, AlertCircle, ChevronDown } from "lucide-react";

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

  const loadData = async () => {
    const res = await fetch("/api/savings");
    const json = await res.json();
    setGoals(json.data || []);
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
        goalName: goal.name
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
              <div key={goal.id} className={`bg-white/45 dark:bg-black/35 border ${dueToday ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-black/[0.05] dark:border-white/[0.04]'} backdrop-blur-md p-6 rounded-3xl shadow-sm space-y-4 animate-modalIn transition-all`}>
                <div className="flex justify-between items-start">
                  <div className={`p-2.5 rounded-xl ${dueToday ? 'bg-indigo-500 text-white animate-pulse' : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'}`}>
                    {dueToday ? <Bell size={20} /> : <Target size={20} />}
                  </div>
                  {dueToday && (
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                      <AlertCircle size={10} /> Save Today!
                    </span>
                  )}
                  {!dueToday && (
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                      {progress.toFixed(0)}% Complete
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-lg text-black dark:text-white">{goal.name}</h3>
                  
                  {/* Assistant Commitment Display */}
                  {goal.installment_amount && (
                    <p className="text-[11px] font-bold text-indigo-500/80 uppercase tracking-tight">
                      {goal.frequency} Commit: {Number(goal.installment_amount).toLocaleString()} Tk
                    </p>
                  )}

                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{current.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 dark:text-zinc-500">/ {target.toLocaleString()} Tk</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/[0.03] dark:border-white/[0.03]">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.4)]" 
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                   <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                      <Calendar size={14} className="text-indigo-500/70" />
                      {new Date(goal.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                   </div>
                   <button 
                    onClick={() => handleAddFunds(goal)}
                    className={`text-xs font-bold transition flex items-center gap-1 px-3 py-1.5 rounded-xl ${dueToday ? 'bg-indigo-500 text-white shadow-md' : 'text-indigo-500 hover:bg-indigo-500/10'}`}
                   >
                    {dueToday ? 'Deposit Now' : 'Add Funds'} <TrendingUp size={12} />
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

        {/* NEW GOAL MODAL - CORRECTED SYNTAX */}
        {showAddModal && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn" onClick={() => setShowAddModal(false)}>
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] sm:max-w-[440px] bg-white dark:bg-[#0d1318] border border-black/10 dark:border-white/10 rounded-[28px] sm:rounded-[40px] p-5 sm:p-8 shadow-2xl animate-modalIn relative"
            >
              <div className="flex justify-between items-center mb-5 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white">Setup Commitment</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 bg-black/5 dark:bg-white/5 rounded-full text-slate-400 hover:scale-110 transition">
                  <X size={18}/>
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 sm:space-y-6">
                
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Goal Name</label>
                  <input required placeholder="e.g. New Laptop" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] outline-none focus:bg-white dark:focus:bg-black transition-all text-sm sm:text-base" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Target (Tk)</label>
                    <input required type="number" placeholder="50000" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="w-full px-4 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] outline-none focus:bg-white dark:focus:bg-black transition-all text-sm sm:text-base" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">End Date</label>
                    <input required type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full px-4 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] outline-none focus:bg-white dark:focus:bg-black transition-all text-sm sm:text-base color-scheme-dark" />
                  </div>
                </div>

                <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[32px] bg-indigo-500/[0.03] border border-indigo-500/10 space-y-4 sm:space-y-6">
                  <p className="text-xs sm:text-sm font-black text-indigo-500/80 uppercase tracking-widest text-center">Auto-Assistant Settings</p>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Cycle Amount</label>
                    <input type="number" placeholder="5000" value={installment} onChange={(e) => setInstallment(e.target.value)} className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-black border border-indigo-500/20 outline-none text-sm sm:text-base font-medium" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 relative" ref={freqRef}>
                      <label className="text-xs sm:text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Frequency</label>
                      <div 
                        onClick={() => setShowFreqDropdown(!showFreqDropdown)}
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-black border border-indigo-500/20 text-sm font-bold flex justify-between items-center cursor-pointer transition-all"
                      >
                        <span className="truncate">{frequency}</span>
                        <ChevronDown size={14} className="text-indigo-500" />
                      </div>

                      {showFreqDropdown && (
                        <div className="absolute bottom-full left-0 w-full mb-2 p-1 bg-white/95 dark:bg-[#161b22] backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-[110] animate-modalIn">
                          {['DAILY', 'WEEKLY', 'MONTHLY'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => { setFrequency(opt); setShowFreqDropdown(false); }}
                              className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition ${frequency === opt ? 'bg-indigo-500 text-white' : 'text-slate-600 dark:text-zinc-400 hover:bg-black/5'}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
                        {frequency === 'MONTHLY' ? 'Date (1-31)' : frequency === 'WEEKLY' ? 'Day (0-6)' : 'Remind'}
                      </label>
                      <input type="number" min="0" max="31" value={reminderDay} onChange={(e) => setReminderDay(e.target.value)} className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-black border border-indigo-500/20 outline-none text-sm sm:text-base font-bold text-indigo-500" />
                    </div>
                  </div>
                </div>

                <button disabled={loading} className="w-full py-3.5 sm:py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-sm sm:text-base uppercase tracking-widest rounded-xl sm:rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18}/>}
                  {loading ? "Saving..." : "Start Assistant"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}