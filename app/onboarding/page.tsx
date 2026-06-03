"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, ArrowRight, Check } from "lucide-react";

type EntryRow = {
  name: string;
  amount: string;
};

type ModalType = 
  | null 
  | "SKIP_BALANCES" 
  | "SKIP_DEBTS" 
  | "SKIP_RECEIVABLES" 
  | "BACK_DEBTS" 
  | "BACK_RECEIVABLES";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [modal, setModal] = useState<ModalType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 State: Balances
  const [cashBalance, setCashBalance] = useState("");
  const [bankBalance, setBankBalance] = useState("");

  // Step 2 State: Debts
  const [debts, setDebts] = useState<EntryRow[]>([{ name: "", amount: "" }]);
  const [bulkDebtsText, setBulkDebtsText] = useState("");

  // Step 3 State: Receivables
  const [receivables, setReceivables] = useState<EntryRow[]>([{ name: "", amount: "" }]);
  const [bulkReceivablesText, setBulkReceivablesText] = useState("");

  // ==========================================
  // BULK PASTE PARSER HELPER
  // ==========================================
  const parseBulkText = (text: string): EntryRow[] => {
    const lines = text.split("\n");
    const parsed: EntryRow[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const lastSpaceIndex = trimmed.lastIndexOf(" ");
      if (lastSpaceIndex === -1) continue;

      const name = trimmed.substring(0, lastSpaceIndex).trim();
      const amountStr = trimmed.substring(lastSpaceIndex + 1).trim();
      const amountNum = Number(amountStr);

      if (name && !isNaN(amountNum) && amountNum > 0) {
        parsed.push({ name, amount: amountStr });
      }
    }
    return parsed;
  };

  const handleBulkParseDebts = () => {
    const parsed = parseBulkText(bulkDebtsText);
    if (parsed.length === 0) return alert("No valid entries found to parse. Format: Name Amount (e.g. Rahim 5000)");
    
    const cleanCurrent = debts.filter(d => d.name || d.amount);
    setDebts([...cleanCurrent, ...parsed]);
    setBulkDebtsText("");
  };

  const handleBulkParseReceivables = () => {
    const parsed = parseBulkText(bulkReceivablesText);
    if (parsed.length === 0) return alert("No valid entries found to parse. Format: Name Amount (e.g. Rahim 5000)");

    const cleanCurrent = receivables.filter(r => r.name || r.amount);
    setReceivables([...cleanCurrent, ...parsed]);
    setBulkReceivablesText("");
  };

  // ==========================================
  // ROW HANDLERS (ADD/REMOVE/UPDATE)
  // ==========================================
  const addRow = (type: "DEBTS" | "RECEIVABLES") => {
    if (type === "DEBTS") {
      setDebts([...debts, { name: "", amount: "" }]);
    } else {
      setReceivables([...receivables, { name: "", amount: "" }]);
    }
  };

  const removeRow = (type: "DEBTS" | "RECEIVABLES", index: number) => {
    if (type === "DEBTS") {
      const updated = debts.filter((_, i) => i !== index);
      setDebts(updated.length === 0 ? [{ name: "", amount: "" }] : updated);
    } else {
      const updated = receivables.filter((_, i) => i !== index);
      setReceivables(updated.length === 0 ? [{ name: "", amount: "" }] : updated);
    }
  };

  const updateRow = (
    type: "DEBTS" | "RECEIVABLES",
    index: number,
    field: "name" | "amount",
    value: string
  ) => {
    if (type === "DEBTS") {
      const updated = [...debts];
      updated[index][field] = value;
      setDebts(updated);
    } else {
      const updated = [...receivables];
      updated[index][field] = value;
      setReceivables(updated);
    }
  };

  // ==========================================
  // FLOW CONTROL & WARNINGS
  // ==========================================
  const handleNextStep1 = () => {
    if (!cashBalance && !bankBalance) {
      setModal("SKIP_BALANCES");
    } else {
      setStep(2);
    }
  };

  const handleBackStep2 = () => {
    const hasData = debts.some(d => d.name || d.amount) || bulkDebtsText.trim();
    if (hasData) {
      setModal("BACK_DEBTS");
    } else {
      setStep(1);
    }
  };

  const handleNextStep2 = () => {
    const validDebts = debts.filter(d => d.name.trim() && Number(d.amount) > 0);
    if (validDebts.length === 0 && !bulkDebtsText.trim()) {
      setModal("SKIP_DEBTS");
    } else {
      setStep(3);
    }
  };

  const handleBackStep3 = () => {
    const hasData = receivables.some(r => r.name || r.amount) || bulkReceivablesText.trim();
    if (hasData) {
      setModal("BACK_RECEIVABLES");
    } else {
      setStep(2);
    }
  };

  const handleFinishStep3 = () => {
    const validReceivables = receivables.filter(r => r.name.trim() && Number(r.amount) > 0);
    if (validReceivables.length === 0 && !bulkReceivablesText.trim()) {
      setModal("SKIP_RECEIVABLES");
    } else {
      handleSubmit();
    }
  };

  // ==========================================
  // FINAL TRANSACTION SUBMIT
  // ==========================================
  const handleSubmit = async () => {
    setModal(null);
    setLoading(true);
    setError("");

    // Compile values
    const payload = {
      cashBalance: cashBalance ? Number(cashBalance) : 0,
      bankBalance: bankBalance ? Number(bankBalance) : 0,
      debts: debts.filter(d => d.name.trim() && Number(d.amount) > 0).map(d => ({
        name: d.name.trim(),
        amount: Number(d.amount),
      })),
      receivables: receivables.filter(r => r.name.trim() && Number(r.amount) > 0).map(r => ({
        name: r.name.trim(),
        amount: Number(r.amount),
      })),
    };

    try {
      const saveRes = await fetch("/api/transactions/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json();
        throw new Error(errData.error || "Failed to save starting positions.");
      }

      const onboardingRes = await fetch("/api/auth/onboarding", {
        method: "POST",
      });

      if (!onboardingRes.ok) {
        throw new Error("Balances saved, but onboarding completion flag failed to write.");
      }

      window.dispatchEvent(new Event("refreshData"));
      router.push("/dashboard");

    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 transition-colors duration-300">
      
      {/* CARD MAIN WRAPPER (Updated responsive padding) */}
      <div className="w-full max-w-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-3xl p-4 sm:p-8 shadow-xl flex flex-col gap-6">
        
        {/* PROGRESS STEP DOTS */}
        <div className="flex justify-between items-center px-4">
          <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
            Step {step} of 3
          </span>
          <div className="flex gap-2">
            <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${step >= 1 ? "bg-green-500" : "bg-slate-200 dark:bg-zinc-800"}`} />
            <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${step >= 2 ? "bg-green-500" : "bg-slate-200 dark:bg-zinc-800"}`} />
            <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${step >= 3 ? "bg-green-500" : "bg-slate-200 dark:bg-zinc-800"}`} />
          </div>
        </div>

        {/* ==========================================
            STEP 1: STARTING BALANCES
            ========================================== */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-black dark:text-white">Set Your Current Balances</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Establish the cash and bank holdings you have on hand today. You can add more later.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Cash Balance</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={cashBalance}
                  onChange={(e) => setCashBalance(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Bank Balance</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={bankBalance}
                  onChange={(e) => setBankBalance(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setModal("SKIP_BALANCES")}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm transition active:scale-95"
              >
                Skip
              </button>
              <button
                onClick={handleNextStep1}
                className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition active:scale-95 flex items-center gap-1.5"
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            STEP 2: EXISTING DEBTS
            ========================================== */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-black dark:text-white">People You Owe</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Enter any outstanding loans or debts you currently owe. Press Next if you don't have any.</p>
            </div>

            {/* Dynamic Manual Rows (Updated with mobile responsive gap and flex input sizes) */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {debts.map((row, index) => (
                <div key={index} className="flex gap-1.5 sm:gap-2 items-center w-full">
                  <input
                    type="text"
                    placeholder="Name (e.g. Rahim)"
                    value={row.name}
                    onChange={(e) => updateRow("DEBTS", index, "name", e.target.value)}
                    className="flex-grow min-w-0 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={row.amount}
                    onChange={(e) => updateRow("DEBTS", index, "amount", e.target.value)}
                    className="w-20 sm:w-32 px-2 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm shrink-0"
                  />
                  <button
                    onClick={() => removeRow("DEBTS", index)}
                    className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-red-500 hover:bg-red-500/10 transition shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Row Button */}
            <button
              onClick={() => addRow("DEBTS")}
              className="self-start flex items-center gap-1.5 text-xs font-bold text-green-500 hover:text-green-400 transition"
            >
              <Plus size={14} /> Add Row
            </button>

            {/* Bulk Paste Area */}
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-900 space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Paste Multiple Debts (Format: Name Amount)</label>
              <textarea
                placeholder={"Rahim 8000\nKarim 3000\nHasan 12000"}
                value={bulkDebtsText}
                onChange={(e) => setBulkDebtsText(e.target.value)}
                className="w-full h-20 px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none font-mono"
              />
              <button
                onClick={handleBulkParseDebts}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-semibold transition"
              >
                Parse & Add
              </button>
            </div>

            {/* Buttons */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handleBackStep2}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-900 transition active:scale-95"
              >
                <ArrowLeft size={16} /> Back
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setModal("SKIP_DEBTS")}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm transition active:scale-95"
                >
                  Skip
                </button>
                <button
                  onClick={handleNextStep2}
                  className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition active:scale-95 flex items-center gap-1.5"
                >
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            STEP 3: EXISTING RECEIVABLES
            ========================================== */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-black dark:text-white">People Who Owe You</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Enter details of money lent out. If you don't have any receivables, press Finish.</p>
            </div>

            {/* Dynamic Manual Rows (Updated with mobile responsive gap and flex input sizes) */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {receivables.map((row, index) => (
                <div key={index} className="flex gap-1.5 sm:gap-2 items-center w-full">
                  <input
                    type="text"
                    placeholder="Name (e.g. Rahim)"
                    value={row.name}
                    onChange={(e) => updateRow("RECEIVABLES", index, "name", e.target.value)}
                    className="flex-grow min-w-0 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={row.amount}
                    onChange={(e) => updateRow("RECEIVABLES", index, "amount", e.target.value)}
                    className="w-20 sm:w-32 px-2 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm shrink-0"
                  />
                  <button
                    onClick={() => removeRow("RECEIVABLES", index)}
                    className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-red-500 hover:bg-red-500/10 transition shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Row Button */}
            <button
              onClick={() => addRow("RECEIVABLES")}
              className="self-start flex items-center gap-1.5 text-xs font-bold text-green-500 hover:text-green-400 transition"
            >
              <Plus size={14} /> Add Row
            </button>

            {/* Bulk Paste Area */}
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-900 space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Paste Multiple Receivables (Format: Name Amount)</label>
              <textarea
                placeholder={"Rahim 8000\nKarim 3000\nHasan 12000"}
                value={bulkReceivablesText}
                onChange={(e) => setBulkReceivablesText(e.target.value)}
                className="w-full h-20 px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none font-mono"
              />
              <button
                onClick={handleBulkParseReceivables}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-semibold transition"
              >
                Parse & Add
              </button>
            </div>

            {/* Error Message */}
            {error && <div className="text-xs text-red-500 font-semibold text-center">{error}</div>}

            {/* Buttons */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handleBackStep3}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-900 transition active:scale-95"
              >
                <ArrowLeft size={16} /> Back
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setModal("SKIP_RECEIVABLES")}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm transition active:scale-95"
                >
                  Skip
                </button>
                <button
                  onClick={handleFinishStep3}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-black font-bold text-sm transition active:scale-95 flex items-center gap-1.5"
                >
                  {loading ? "Saving..." : "Finish"} <Check size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ==========================================
          WARNING & CONFIRMATION MODALS
          ========================================== */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 dark:bg-black/90 border border-slate-200 dark:border-zinc-800 backdrop-blur-xl rounded-3xl p-6 w-full max-w-[340px] text-center shadow-2xl flex flex-col gap-4 animate-modalIn">
            
            <h3 className="text-lg font-bold text-black dark:text-white">
              {modal.startsWith("SKIP") ? "Are you sure?" : "Discard Changes?"}
            </h3>

            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              {modal === "SKIP_BALANCES" && "Skipping means your account will start with zero balances. You can add existing balances later from Add History."}
              {modal === "SKIP_DEBTS" && "No debt records will be created. You can add them later from Add History."}
              {modal === "SKIP_RECEIVABLES" && "No receivable records will be created. You can add them later from Add History."}
              {modal.startsWith("BACK") && "You have unsaved entries. Going back will discard them."}
            </p>

            <div className="flex gap-3 justify-center mt-2">
              <button
                onClick={() => {
                  if (modal === "SKIP_BALANCES") {
                    setStep(2);
                    setModal(null);
                  } else if (modal === "SKIP_DEBTS") {
                    setStep(3);
                    setModal(null);
                  } else if (modal === "SKIP_RECEIVABLES") {
                    handleSubmit();
                  } else if (modal === "BACK_DEBTS") {
                    setDebts([{ name: "", amount: "" }]);
                    setBulkDebtsText("");
                    setStep(1);
                    setModal(null);
                  } else if (modal === "BACK_RECEIVABLES") {
                    setReceivables([{ name: "", amount: "" }]);
                    setBulkReceivablesText("");
                    setStep(2);
                    setModal(null);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition active:scale-95"
              >
                {modal.startsWith("SKIP") ? "Skip" : "Discard"}
              </button>

              <button
                onClick={() => setModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm transition active:scale-95"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
