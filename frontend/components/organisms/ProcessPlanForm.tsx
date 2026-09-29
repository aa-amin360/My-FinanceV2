"use client";

import React, { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Dropdown from "@/frontend/components/molecules/Dropdown";
import { ACCOUNT_OPTIONS, localDateString } from "@/shared/config";
import { budgetApi } from "@/frontend/api/budget";
import { errorMessage } from "@/frontend/api/client";
import type { BudgetPlan as Plan } from "@/shared/apiTypes";
import { requestRefresh } from "@/frontend/lib/events";
import { useClickOutside } from "@/frontend/hooks/useClickOutside";
import ErrorText from "@/frontend/components/atoms/ErrorText";
import Presence from "@/frontend/components/atoms/Presence";

type ProcessPlanFormProps = {
  plan: Plan;
  onSuccess: () => void;
  onClose: () => void;
};

export default function ProcessPlanForm({ plan, onSuccess, onClose }: ProcessPlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Workflow operational states
  const [processAccount, setAccount] = useState("Cash");
  const [partialAmount, setPartialAmount] = useState("");
  const [isPartial, setIsPartial] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Inline custom date picker state fields for reschedule path
  const [showReschedulePicker, setShowReschedulePicker] = useState(false);
  const [reschedulePickerDate, setReschedulePickerDate] = useState(() => new Date());

  const reschedulePickerRef = useRef<HTMLDivElement | null>(null);

  // Custom calendar helper calculations
  const getPickerGridCells = (viewDate: Date) => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const totalDays = new Date(y, m + 1, 0).getDate();
    const firstDayIndex = new Date(y, m, 1).getDay();
    const padding = Array.from({ length: firstDayIndex }, () => null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    return [...padding, ...days];
  };

  const isPastDay = (day: number, viewDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const checkDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return checkDate < today;
  };

  // Close when clicking outside
  useClickOutside(reschedulePickerRef, () => setShowReschedulePicker(false));

  // Confirm and partial both create a real transaction and update the plan in a
  // single server-side database transaction (see /api/budget/[id]/process)
  const processPlan = async (action: "CONFIRM" | "PARTIAL", amount?: number) => {
    setLoading(true);
    setError("");

    try {
      await budgetApi.process(plan.id, {
        action,
        amount,
        account: processAccount,
        date: localDateString(),
      });

      requestRefresh();
      onSuccess();
    } catch (err) {
      setError(errorMessage(err, "Failed to process this plan."));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => processPlan("CONFIRM");

  const handlePartial = () => {
    const partialAmt = Number(partialAmount);
    const planAmt = Number(plan.amount);

    if (isNaN(partialAmt) || partialAmt <= 0 || partialAmt >= planAmt) {
      setError("Enter a valid partial amount less than the total planned amount.");
      return;
    }

    processPlan("PARTIAL", partialAmt);
  };

  const handleSkip = async () => {
    setLoading(true);
    setError("");

    try {
      await budgetApi.update(plan.id, { status: "SKIPPED" });
      onSuccess();
    } catch (err) {
      setError(errorMessage(err, "Failed to skip plan."));
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate) return;
    setLoading(true);
    setError("");

    try {
      await budgetApi.update(plan.id, { date: rescheduleDate });
      onSuccess();
    } catch (err) {
      setError(errorMessage(err, "Failed to reschedule plan."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      <ErrorText message={error} />

      {!isPartial && !isRescheduling ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal text-left">
            How do you want to handle this scheduled event?
          </p>
          
          <Dropdown
            label="Account"
            options={ACCOUNT_OPTIONS}
            selectedValue={processAccount}
            onChange={(val) => setAccount(val)}
          />

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm transition disabled:opacity-50 active:scale-95"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setIsPartial(true)}
              disabled={loading}
              className="py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold text-xs sm:text-sm border border-blue-500/20 transition disabled:opacity-50 active:scale-95"
            >
              Partial
            </button>
            <button
              type="button"
              onClick={() => setIsRescheduling(true)}
              disabled={loading}
              className="py-2.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 font-bold text-xs sm:text-sm border border-yellow-500/20 transition disabled:opacity-50 active:scale-95"
            >
              Reschedule
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs sm:text-sm border border-transparent dark:border-zinc-800/80 transition disabled:opacity-50 active:scale-95"
            >
              Skip
            </button>
          </div>
        </div>
      ) : isPartial ? (
        <div className="flex flex-col gap-3.5">
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold text-left">
            Enter amount paid/received:
          </p>
          <input
            type="number"
            placeholder="Partial Amount"
            min="0.01" 
            step="any"
            value={partialAmount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || Number(val) >= 0) {
                setPartialAmount(val);
              }
            }}
            className="px-3 py-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-xs text-black dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none outline-none focus:bg-white dark:focus:bg-zinc-950 transition"
          />

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={handlePartial}
              disabled={loading}
              className="py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm transition disabled:opacity-50 active:scale-95"
            >
              Save Partial
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPartial(false);
                setPartialAmount("");
              }}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs sm:text-sm transition active:scale-95"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold text-left">
            Select new scheduled date:
          </p>
          
          <div ref={reschedulePickerRef} className="relative flex flex-col text-left">
            <div
              onClick={() => setShowReschedulePicker(!showReschedulePicker)}
              className="px-3 py-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] text-xs text-black dark:text-white cursor-pointer flex justify-between items-center hover:bg-black/[0.04] transition-all"
            >
              <span>
                {rescheduleDate 
                  ? new Date(rescheduleDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
                  : "Select new date..."
                }
              </span>
              <span className="text-zinc-400">📅</span>
            </div>

            <Presence show={showReschedulePicker} exitMs={140}>
              <div className="absolute bottom-full left-0 w-full mb-1.5 p-3 bg-white dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.04] rounded-2xl shadow-xl z-50 flex flex-col gap-2 animate-popIn" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center text-[11px] font-bold text-black dark:text-white leading-none">
                  <button type="button" onClick={() => setReschedulePickerDate(new Date(reschedulePickerDate.getFullYear(), reschedulePickerDate.getMonth() - 1, 1))} className="p-1 rounded hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition">
                    <ChevronLeft size={12} />
                  </button>
                  <span>{reschedulePickerDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                  <button type="button" onClick={() => setReschedulePickerDate(new Date(reschedulePickerDate.getFullYear(), reschedulePickerDate.getMonth() + 1, 1))} className="p-1 rounded hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition">
                    <ChevronRight size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-bold text-zinc-400">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {getPickerGridCells(reschedulePickerDate).map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} className="aspect-square" />;
                    }
                    
                    const isPast = isPastDay(day, reschedulePickerDate);
                    const isSelected = rescheduleDate === `${reschedulePickerDate.getFullYear()}-${(reschedulePickerDate.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={isPast}
                        onClick={() => {
                          const y = reschedulePickerDate.getFullYear();
                          const m = (reschedulePickerDate.getMonth() + 1).toString().padStart(2, "0");
                          const d = day.toString().padStart(2, "0");
                          setRescheduleDate(`${y}-${m}-${d}`);
                          setShowReschedulePicker(false);
                        }}
                        className={`
                          aspect-square text-[9px] font-bold rounded-lg transition-all flex items-center justify-center
                          ${isPast 
                            ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-50" 
                            : isSelected
                            ? "bg-green-500 text-black shadow-sm"
                            : "text-slate-700 dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                          }
                        `}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Presence>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={handleReschedule}
              disabled={loading}
              className="py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm transition disabled:opacity-50 active:scale-95"
            >
              Reschedule
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs sm:text-sm transition active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}