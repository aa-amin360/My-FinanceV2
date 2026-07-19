"use client";

import React, { useState, useEffect, useRef } from "react";
import Dropdown from "@/components/ui/Dropdown";
import GlassCalendar from "./GlassCalendar";

type Category = {
  id: string;
  name: string;
  type: string;
};

type AddPlanFormProps = {
  categories: Category[];
  onSuccess: () => void;
  onClose: () => void;
};

export default function AddPlanForm({ categories, onSuccess, onClose }: AddPlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Self-contained form states
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [targetSearch, setTargetSearch] = useState("");
  const [selectedTarget, setSelectedDateTarget] = useState<{ id: string | null; name: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  const [showTargetDropdown, setShowTargetDropdown] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement | null>(null);

  // Close autocomplete suggestions dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowTargetDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getFilteredSuggestions = () => {
    const cleanQuery = targetSearch.trim().toLowerCase();
    const filtered = categories.filter((c) => c.type === type);
    if (!cleanQuery) return filtered;
    return filtered.filter((c) => c.name.toLowerCase().includes(cleanQuery));
  };

  const suggestions = getFilteredSuggestions();
  const showCreateCategoryTrigger = 
    targetSearch.trim() !== "" && 
    !suggestions.some((s) => s.name.toLowerCase() === targetSearch.trim().toLowerCase());

  const handleQuickCategorySave = async () => {
    if (!targetSearch.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetSearch.trim(), type }),
      });
      const json = await res.json();
      if (json.success) {
        const newCat = json.data;
        categories.push(newCat); 
        setSelectedDateTarget({ id: newCat.id, name: newCat.name });
        setTargetSearch(newCat.name);
        setShowTargetDropdown(false);
      } else {
        alert(json.error || "Failed to create category");
      }
    } catch {
      alert("Failed to create category");
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const targetName = selectedTarget ? selectedTarget.name : targetSearch.trim();
    const targetId = selectedTarget ? selectedTarget.id : null;

    if (!targetName || !amount || !date) {
      setError("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    const amountNumber = Number(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setError("Amount must be a positive number greater than 0.");
      setLoading(false);
      return;
    }

    const todayStr = new Date().toLocaleDateString("en-CA");
    if (date < todayStr) {
      setError("Scheduled date cannot be in the past.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: amountNumber,
          target_id: targetId,
          target_name: targetName,
          date,
          note: note.trim() || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save plan.");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save budget plan.");
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: "EXPENSE", label: "Expense" },
    { value: "INCOME", label: "Income" },
  ];

  return (
    <form onSubmit={handleCreatePlan} className="flex flex-col gap-3.5 text-left">
      {/* Type Dropdown */}
      <Dropdown
        label="Planning Type"
        options={typeOptions}
        selectedValue={type}
        onChange={(val) => {
          setType(val);
          setSelectedDateTarget(null);
          setTargetSearch("");
        }}
      />

      {/* Autocomplete Input Search */}
      <div ref={autocompleteRef} className="flex flex-col gap-1 relative text-left">
        <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
          {type === "EXPENSE" ? "Expense Category" : "Income Category"}
        </label>
        <input
          type="text"
          required
          placeholder="Search Category..."
          value={targetSearch}
          onFocus={() => setShowTargetDropdown(true)}
          onChange={(e) => {
            setTargetSearch(e.target.value);
            setSelectedDateTarget(null);
            setShowTargetDropdown(true);
          }}
          className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-sm text-xs sm:text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200"
        />

        {showTargetDropdown && (
          <div className="absolute top-full left-0 w-full mt-1.5 p-1 max-h-40 overflow-y-auto bg-white/95 dark:bg-black/95 border border-black/[0.05] dark:border-white/[0.05] rounded-2xl shadow-xl z-50 flex flex-col divide-y divide-slate-100 dark:divide-zinc-900 animate-modalIn">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedDateTarget({ id: s.id, name: s.name });
                  setTargetSearch(s.name);
                  setShowTargetDropdown(false);
                }}
                className="px-4 py-2.5 text-left text-xs font-semibold hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition text-slate-700 dark:text-zinc-300"
              >
                {s.name}
              </button>
            ))}

            {showCreateCategoryTrigger && (
              <button
                type="button"
                onClick={handleQuickCategorySave}
                className="px-4 py-3 text-left text-xs font-semibold text-green-500 hover:bg-green-500/10 transition leading-normal border-t border-black/[0.05] dark:border-white/[0.04]"
              >
                No category found. Create "{targetSearch}"?
              </button>
            )}

            {suggestions.length === 0 && !showCreateCategoryTrigger && (
              <div className="p-4 text-center text-xs text-slate-400">
                Type to select or use new name
              </div>
            )}
          </div>
        )}
      </div>

      {/* Amount input */}
      <div className="flex flex-col gap-1 text-left">
        <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Amount</label>
        <input
          type="number"
          required
          min="0.01" 
          step="any"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || Number(val) >= 0) {
              setAmount(val);
            }
          }}
          className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-xs sm:text-sm text-black dark:text-white outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      {/* Reusable GlassCalendar integration (Configured with blockPastDates=true) */}
      <div className="flex flex-col gap-1 text-left">
        <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Scheduled Date</label>
        <GlassCalendar 
          value={date} 
          onChange={setDate} 
          placeholder="Select expected date..." 
          blockPastDates={true}
        />
      </div>

      {/* Optional Note */}
      <div className="flex flex-col gap-1 text-left">
        <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Add Note (Optional)</label>
        <input
          type="text"
          placeholder="Add note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-xs sm:text-sm text-black dark:text-white"
        />
      </div>

      {error && <div className="text-xs text-red-500 font-bold text-center leading-normal">{error}</div>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-black font-bold text-xs sm:text-sm transition active:scale-95 shadow-md"
        >
          {loading ? "Saving plan..." : "Create Plan"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-3 rounded-xl bg-black/5 dark:bg-white/5 text-slate-600 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider transition active:scale-95"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}