"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DebtSetupGrid from "@/components/features/history/DebtSetupGrid";
import ReceivableSetupGrid from "@/components/features/history/ReceivableSetupGrid";
import { Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRefresh } from "@/hooks/useRefresh";

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

  // Self-contained grid payloads (managed via callback triggers)
  const [debtsPayload, setDebtsPayload] = useState<{ name: string; amount: number }[]>([]);
  const [receivablesPayload, setReceivablesPayload] = useState<{ name: string; amount: number }[]>([]);

  // Load configuration status of opening balances from API
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

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    const payload: any = {
      debts: debtsPayload,
      receivables: receivablesPayload,
    };

    if (!isBalancesInitialized) {
      if (cashBalance) payload.cashBalance = Number(cashBalance);
      if (bankBalance) payload.bankBalance = Number(bankBalance);
    }

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
      setCashBalance("");
      setBankBalance("");
      
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
      <div className="w-full space-y-6 animate-fadeIn pb-16 px-1 sm:px-4">
        
        {/* Header Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Add History</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-500">Log forgotten starting balances, active debts, or receivables to keep your ledger starting position accurate.</p>
        </div>

        {initChecking ? (
          <div className="text-center text-slate-400 py-8">Checking configuration status...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">

            {/* 1. OPENING BALANCES SECTION */}
            <div className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-sm shadow-black/[0.01] space-y-4">
              <h3 className="text-lg font-bold text-black dark:text-white leading-none">Opening Balances</h3>
              
              {isBalancesInitialized ? (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 animate-fadeIn">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold">
                    Balances are configured
                  </span>
                </div>
              ) : (
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
                        className="px-4 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Starting Bank Balance</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={bankBalance}
                        onChange={(e) => setBankBalance(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. EXISTING DEBTS SECTION */}
            <div className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-sm shadow-black/[0.01] space-y-4">
              <h3 className="text-lg font-bold text-black dark:text-white leading-none">Existing Debts</h3>
              <DebtSetupGrid onChange={setDebtsPayload} />
            </div>

            {/* 3. EXISTING RECEIVABLES SECTION */}
            <div className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-sm shadow-black/[0.01] space-y-4">
              <h3 className="text-lg font-bold text-black dark:text-white leading-none">Existing Receivables</h3>
              <ReceivableSetupGrid onChange={setReceivablesPayload} />
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