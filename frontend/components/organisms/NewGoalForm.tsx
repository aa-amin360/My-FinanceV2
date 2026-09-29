"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import GlassCalendar from "@/frontend/components/molecules/GlassCalendar";
import { CURRENCY, localDateString } from "@/shared/config";
import { errorMessage } from "@/frontend/api/client";
import { savingsApi } from "@/frontend/api/savings";
import Dropdown from "@/frontend/components/molecules/Dropdown";
import FieldLabel from "@/frontend/components/atoms/FieldLabel";
import ErrorText from "@/frontend/components/atoms/ErrorText";

type NewGoalFormProps = {
  onSuccess: () => void;
  onClose: () => void;
};

export default function NewGoalForm({ onSuccess, onClose }: NewGoalFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Self-contained form state fields
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [installment, setInstallment] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [reminderDay, setReminderDay] = useState("1");

  // Forecast algorithm to predict dynamic goal timeline
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

  // Automatic target date sync based on commitment settings
  useEffect(() => {
    if (forecast?.date) {
      setTargetDate(localDateString(forecast.date));
    }
    // Only re-sync when the commitment inputs change, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetAmount, installment, frequency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await savingsApi.create({
        name,
        target_amount: targetAmount,
        target_date: targetDate || null,
        installment_amount: installment || null,
        frequency,
        reminder_day: frequency !== "DAILY" && reminderDay !== "" ? Number(reminderDay) : null,
      });

      onSuccess();
    } catch (err) {
      setError(errorMessage(err, "Failed to create savings goal."));
    } finally {
      setLoading(false);
    }
  };

  const frequencyOptions = [
    { value: "DAILY", label: "DAILY" },
    { value: "WEEKLY", label: "WEEKLY" },
    { value: "MONTHLY", label: "MONTHLY" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
      {/* Goal Name */}
      <div className="space-y-1">
        <FieldLabel inset>Goal Name</FieldLabel>
        <input 
          required 
          placeholder="e.g. New Laptop" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="w-full px-4 py-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] outline-none focus:bg-white dark:focus:bg-black transition-all text-xs sm:text-sm text-black dark:text-white" 
        />
      </div>

      {/* Target Amount & Target Date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
            Target ({CURRENCY})
          </label>
          <input 
            required 
            type="number" 
            placeholder="50000" 
            value={targetAmount} 
            onChange={(e) => setTargetAmount(e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] outline-none text-xs sm:text-sm text-black dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
          />
        </div>
        <div className="space-y-1">
          <FieldLabel inset>End Date</FieldLabel>
          {/* GlassCalendar is now configured to block past dates */}
          <GlassCalendar 
            value={targetDate} 
            onChange={setTargetDate} 
            placeholder="Select Date" 
            blockPastDates={true}
          />
        </div>
      </div>

      {/* Commitment parameters widget */}
      <div className="p-4 rounded-2xl bg-indigo-500/[0.03] border border-indigo-500/10 space-y-3">
        <p className="text-[8px] sm:text-[9px] font-black text-indigo-500/80 uppercase tracking-widest text-center">Commitment Settings</p>
        
        <div className="space-y-1">
          <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Cycle Amount</label>
          <input 
            type="number" 
            placeholder="5000" 
            value={installment} 
            onChange={(e) => setInstallment(e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-black border border-indigo-500/20 outline-none text-xs sm:text-sm font-medium text-black dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Dropdown
            label="Frequency"
            options={frequencyOptions}
            selectedValue={frequency}
            onChange={(val) => {
              setFrequency(val);
              if (val === "WEEKLY" && Number(reminderDay) > 6) setReminderDay("0");
            }}
          />
          <div className="space-y-1">
            <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
              {frequency === 'MONTHLY' ? 'Date' : frequency === 'WEEKLY' ? 'Day (0=Sun)' : 'Day'}
            </label>
            <input 
              type="number" 
              min={frequency === "WEEKLY" ? 0 : 1}
              max={frequency === "WEEKLY" ? 6 : 31}
              disabled={frequency === "DAILY"}
              value={reminderDay} 
              onChange={(e) => setReminderDay(e.target.value)} 
              className="w-full px-3 py-2.5 rounded-2xl bg-white dark:bg-black border border-indigo-500/20 outline-none text-xs font-bold text-indigo-500 text-center" 
            />
          </div>
        </div>
      </div>

      {/* Dynamic Forecast Notification */}
      {forecast && (
        <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-center animate-fadeIn">
          <p className="text-[10px] sm:text-xs font-bold text-black dark:text-white leading-none">
            Approx <span className="text-indigo-500">{forecast.text}</span> to reach goal
          </p>
        </div>
      )}

      <ErrorText message={error} />

      <div className="flex gap-3 pt-2">
        <button 
          type="submit"
          disabled={loading} 
          className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16}/>}
          {loading ? "Saving..." : "Start Assistant"}
        </button>
      </div>
    </form>
  );
}