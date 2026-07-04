"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, Trash2, Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRefresh } from "@/hooks/useRefresh";

type EntryRow = {
  name: string;
  amount: string;
};

export default function AddHistoryPage() {
  const [loading, setLoading] = useState(false);
  const [initChecking, setInitChecking] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Server-side State: Checks if Opening Balances have already been configured
  const [isBalancesInitialized, setIsBalancesInitialized] = useState(false);
  const [configuredCash, setConfiguredCash] = useState<number | null>(null);
  const [configuredBank, setConfiguredBank] = useState<number | null>(null);

  // Inputs State
  const [cashBalance, setCashBalance] = useState("");
  const [bankBalance, setBankBalance] = useState("");

  const [debts, setDebts] = useState<EntryRow[]>([{ name: "", amount: "" }]);
  const [bulkDebtsText, setBulkDebtsText] = useState("");

  const [receivables, setReceivables] = useState<EntryRow[]>([{ name: "", amount: "" }]);
  const [bulkReceivablesText, setBulkReceivablesText] = useState("");

  // ==========================================
  // LOAD CONFIGURATION STATUS
  // ==========================================
  const checkBalanceStatus = async () => {
    try {
      const res = await fetch("/api/transactions/history", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setIsBalancesInitialized(json.isInitialized);
        setConfiguredCash(json.cashValue);
        setConfiguredBank(json.bankValue);
      }
    } catch (err) {
      console.error("Failed to fetch historical balance status:", err);
    } finally {
      setInitChecking(false);
    }
  };

  useEffect(() => {
    checkBalanceStatus();
  }, []);

  useRefresh(checkBalanceStatus);

  // ==========================================
  // BULK PASTE PARSER HELPERS
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
  // ROW HANDLERS
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
  // SAVE CHANGES HANDLER
  // ==========================================
  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    // Compile values
    const payload: any = {
      debts: debts.filter(d => d.name.trim() && Number(d.amount) > 0).map(d => ({
        name: d.name.trim(),
        amount: Number(d.amount),
      })),
      receivables: receivables.filter(r => r.name.trim() && Number(r.amount) > 0).map(r => ({
        name: r.name.trim(),
        amount: Number(r.amount),
      })),
    };

    // Only send balances if they have not been configured yet and user wrote values
    if (!isBalancesInitialized) {
      if (cashBalance) payload.cashBalance = Number(cashBalance);
      if (bankBalance) payload.bankBalance = Number(bankBalance);
    }

    // Validation: check if they entered anything at all
    const hasBalances = !isBalancesInitialized && (cashBalance || bankBalance);
    if (!hasBalances && payload.debts.length === 0 && payload.receivables.length === 0) {
      setError("Please enter at least one balance, debt, or receivable before saving.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/transactions/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save historical additions.");
      }

      setSuccess("Historical records added successfully!");
      
      // Reset inputs
      setCashBalance("");
      setBankBalance("");
      setDebts([{ name: "", amount: "" }]);
      setReceivables([{ name: "", amount: "" }]);
      
      // Refresh balances and reload initial check
      window.dispatchEvent(new Event("refreshData"));
      await checkBalanceStatus();

    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 pb-12">
        
        {/* HEADER */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-black dark:text-white">Add History</h1>
        </div>

        {initChecking ? (
          <div className="text-center text-slate-400 py-8">Checking configuration status...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">

            {/* ==========================================
                1. OPENING BALANCES SECTION
                ========================================== */}
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-black dark:text-white">Opening Balances</h3>
              
              {isBalancesInitialized ? (
                /* Already Configured Panel */
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 animate-fadeIn">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold">
                    Balances are configured
                  </span>
                </div>
              ) : (
                /* Editable Balance Inputs */
                <div className="space-y-4">
                  <div className="flex gap-3 p-4 rounded-2xl bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20">
                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm leading-normal font-medium">
                      Opening balances have never been initialized. Setting them here will establish your starting capital. This can only be done once.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Starting Cash Balance</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={cashBalance}
                        onChange={(e) => setCashBalance(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Starting Bank Balance</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={bankBalance}
                        onChange={(e) => setBankBalance(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ==========================================
                2. EXISTING DEBTS SECTION
                ========================================== */}
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-black dark:text-white">Existing Debts</h3>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
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

              <button
                onClick={() => addRow("DEBTS")}
                className="self-start flex items-center gap-1.5 text-xs font-bold text-green-500 hover:text-green-400 transition"
              >
                <Plus size={14} /> Add Row
              </button>

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
            </div>

            {/* ==========================================
                3. EXISTING RECEIVABLES SECTION
                ========================================== */}
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-black dark:text-white">Existing Receivables</h3>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
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

              <button
                onClick={() => addRow("RECEIVABLES")}
                className="self-start flex items-center gap-1.5 text-xs font-bold text-green-500 hover:text-green-400 transition"
              >
                <Plus size={14} /> Add Row
              </button>

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
            </div>

            {/* Error and Success Indicators */}
            {error && <div className="text-sm font-semibold text-red-500 text-center">{error}</div>}
            {success && <div className="text-sm font-semibold text-green-500 text-center">{success}</div>}

            {/* Master Save Button */}
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-2xl bg-green-500 hover:bg-green-400 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-black font-bold text-sm transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Save size={18} /> {loading ? "Saving records..." : "Save Historical Entries"}
            </button>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
