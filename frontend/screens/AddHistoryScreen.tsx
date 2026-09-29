"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import Heading from "@/frontend/components/atoms/Heading";
import Subtitle from "@/frontend/components/atoms/Subtitle";
import SectionCard from "@/frontend/components/molecules/SectionCard";
import EntrySetupGrid, { SetupEntry } from "@/frontend/components/organisms/EntrySetupGrid";
import OpeningBalancesSection from "@/frontend/components/organisms/OpeningBalancesSection";
import { useRefresh } from "@/frontend/hooks/useRefresh";
import { errorMessage } from "@/frontend/api/client";
import { HistoryInput, historyApi } from "@/frontend/api/history";
import { requestRefresh } from "@/frontend/lib/events";
import { localDateString } from "@/shared/config";

export default function AddHistoryScreen() {
  const [loading, setLoading] = useState(false);
  const [initChecking, setInitChecking] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Opening balances can only be set once
  const [balancesInitialized, setBalancesInitialized] = useState(false);
  const [cashBalance, setCashBalance] = useState("");
  const [bankBalance, setBankBalance] = useState("");

  const [debts, setDebts] = useState<SetupEntry[]>([]);
  const [receivables, setReceivables] = useState<SetupEntry[]>([]);
  // Bumped after a successful save to remount (clear) the entry grids
  const [formKey, setFormKey] = useState(0);

  const checkBalanceStatus = async () => {
    try {
      const status = await historyApi.status();
      setBalancesInitialized(status.isInitialized);
    } catch (err) {
      console.error("Failed to fetch historical balance status:", err);
    } finally {
      setInitChecking(false);
    }
  };

  useRefresh(checkBalanceStatus);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    const payload: HistoryInput = { debts, receivables, date: localDateString() };
    if (!balancesInitialized) {
      if (cashBalance) payload.cashBalance = Number(cashBalance);
      if (bankBalance) payload.bankBalance = Number(bankBalance);
    }

    const hasBalances = !balancesInitialized && (cashBalance || bankBalance);
    if (!hasBalances && debts.length === 0 && receivables.length === 0) {
      setError("Please enter at least one balance, debt, or receivable before saving.");
      setLoading(false);
      return;
    }

    try {
      await historyApi.save(payload);

      setSuccess("Historical records added successfully!");
      setCashBalance("");
      setBankBalance("");
      setFormKey((key) => key + 1);

      requestRefresh();
      await checkBalanceStatus();
    } catch (err) {
      setError(errorMessage(err, "Failed to save historical additions."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full space-y-6 pb-16 px-1 sm:px-4">
        <div className="space-y-1">
          <Heading>Add History</Heading>
          <Subtitle>Log forgotten starting balances, active debts, or receivables to keep your ledger starting position accurate.</Subtitle>
        </div>

        {initChecking ? (
          <div className="text-center text-slate-400 py-8">Checking configuration status...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <OpeningBalancesSection
              initialized={balancesInitialized}
              cashBalance={cashBalance}
              bankBalance={bankBalance}
              onCashChange={setCashBalance}
              onBankChange={setBankBalance}
            />

            <SectionCard title="Existing Debts">
              <EntrySetupGrid key={`debts-${formKey}`} label="Debts" onChange={setDebts} />
            </SectionCard>

            <SectionCard title="Existing Receivables">
              <EntrySetupGrid key={`receivables-${formKey}`} label="Receivables" onChange={setReceivables} />
            </SectionCard>

            {error && <div className="text-sm font-semibold text-red-500 text-center">{error}</div>}
            {success && <div className="text-sm font-semibold text-green-500 text-center">{success}</div>}

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
    </>
  );
}
