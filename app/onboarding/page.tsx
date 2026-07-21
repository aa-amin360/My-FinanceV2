"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import DebtSetupGrid from "@/components/features/history/DebtSetupGrid";
import ReceivableSetupGrid from "@/components/features/history/ReceivableSetupGrid";

type ModalType = 
  | null 
  | "SKIP_BALANCES" 
  | "SKIP_DEBTS" 
  | "SKIP_RECEIVABLES" 
  | "BACK_DEBTS" 
  | "BACK_RECEIVABLES";

export default function OnboardingPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [modal, setModal] = useState<ModalType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 State: Balances
  const [cashBalance, setCashBalance] = useState("");
  const [bankBalance, setBankBalance] = useState("");

  // Step 2 & 3 State Payloads (re-used from dynamic setup grid callbacks)
  const [debtsPayload, setDebtsPayload] = useState<{ name: string; amount: number }[]>([]);
  const [receivablesPayload, setReceivablesPayload] = useState<{ name: string; amount: number }[]>([]);

  // Active Reverse Route Guard to intercept and push already onboarded users to dashboard
  useEffect(() => {
    const checkAlreadyOnboarded = async () => {
      try {
        const res = await fetch("/api/auth/onboarding");
        const data = await res.json();
        if (data.success && data.history_initialized) {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Onboarding exit check failed:", err);
      }
    };

    checkAlreadyOnboarded();
  }, [router]);

  // Step 1 Next Validator
  const handleNextStep1 = () => {
    if (!cashBalance && !bankBalance) {
      setModal("SKIP_BALANCES");
    } else {
      setStep(2);
    }
  };

  // Step 2 Back & Next Validators
  const handleBackStep2 = () => {
    if (debtsPayload.length > 0) {
      setModal("BACK_DEBTS");
    } else {
      setStep(1);
    }
  };

  const handleNextStep2 = () => {
    if (debtsPayload.length === 0) {
      setModal("SKIP_DEBTS");
    } else {
      setStep(3);
    }
  };

  // Step 3 Back & Finish Validators
  const handleBackStep3 = () => {
    if (receivablesPayload.length > 0) {
      setModal("BACK_RECEIVABLES");
    } else {
      setStep(2);
    }
  };

  const handleFinishStep3 = () => {
    if (receivablesPayload.length === 0) {
      setModal("SKIP_RECEIVABLES");
    } else {
      handleSubmit();
    }
  };

  // Final onboarding configuration submission
  const handleSubmit = async () => {
    setModal(null);
    setLoading(true);
    setError("");

    const payload = {
      cashBalance: cashBalance ? Number(cashBalance) : 0,
      bankBalance: bankBalance ? Number(bankBalance) : 0,
      debts: debtsPayload,
      receivables: receivablesPayload,
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
    <div className="relative min-h-screen bg-[#E7EBED] dark:bg-[#131B21] text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 transition-colors duration-300">
      
      {/* Ambient Glow Backdrop Blur */}
      <div className="
        absolute inset-0 z-0 pointer-events-none overflow-hidden select-none
        bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,0,0,0.08),rgba(255,255,255,0))] 
        dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.14),rgba(0,0,0,0))]
      " />

      {/* Header controls */}
      <header className="relative z-10 max-w-xl w-full mx-auto h-16 flex items-center justify-between shrink-0 px-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center text-black font-extrabold text-sm shadow-md shadow-green-500/10">
            M
          </div>
          <span className="font-extrabold text-sm tracking-wide text-green-500">My Finance</span>
        </div>

        <button
          onClick={toggleTheme}
          type="button"
          className="relative w-12 h-6 rounded-full transition-colors duration-300 bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.05] focus:outline-none shrink-0"
          aria-label="Toggle theme"
        >
          <div
            className={`
              absolute top-[1.5px] left-[1px] w-5 h-5 rounded-full bg-white dark:bg-zinc-800
                  shadow-md flex items-center justify-center text-zinc-500 dark:text-yellow-400
              transition-transform duration-300
              ${theme === "dark" ? "translate-x-6" : "translate-x-0"}
            `}
          >
            {theme === "dark" ? <Moon size={11} /> : <Sun size={11} />}
          </div>
        </button>
      </header>

      {/* Core modal wrapper container */}
      <div className="relative z-10 w-full max-w-xl mx-auto bg-white/75 dark:bg-black/60 border border-black/[0.05] dark:border-white/[0.05] backdrop-blur-xl rounded-3xl p-4 sm:p-8 shadow-2xl flex flex-col gap-6 animate-modalIn">
        
        {/* Step dot progress indicator */}
        <div className="flex justify-between items-center px-4">
          <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
            Step {step} of 3
          </span>
          <div className="flex gap-2">
            <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${step >= 1 ? "bg-green-500" : "bg-black/[0.05] dark:bg-white/[0.05]"}`} />
            <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${step >= 2 ? "bg-green-500" : "bg-black/[0.05] dark:bg-white/[0.05]"}`} />
            <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${step >= 3 ? "bg-green-500" : "bg-black/[0.05] dark:bg-white/[0.05]"}`} />
          </div>
        </div>

        {/* STEP 1: BALANCES CONTROL */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white">Set Your Current Balances</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Establish the cash and bank holdings you have on hand today. You can add more later.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Cash Balance</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={cashBalance}
                  onChange={(e) => setCashBalance(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Bank Balance</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={bankBalance}
                  onChange={(e) => setBankBalance(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setModal("SKIP_BALANCES")}
                className="px-5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] text-slate-700 dark:text-zinc-300 font-bold text-xs sm:text-sm hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition active:scale-95"
              >
                Skip
              </button>
              <button
                onClick={handleNextStep1}
                className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm transition active:scale-95 flex items-center gap-1.5 shadow-sm shadow-green-500/10"
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DEBTS SETUP */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white">People You Owe</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Enter any outstanding loans or debts you currently owe. Press Next if you don't have any.</p>
            </div>

            {/* Consumer setup grid */}
            <DebtSetupGrid onChange={setDebtsPayload} />

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handleBackStep2}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-black/[0.05] dark:border-white/[0.05] text-slate-600 dark:text-zinc-400 font-bold text-xs sm:text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition active:scale-95"
              >
                <ArrowLeft size={16} /> Back
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setModal("SKIP_DEBTS")}
                  className="px-5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] text-slate-700 dark:text-zinc-300 font-bold text-xs sm:text-sm hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition active:scale-95"
                >
                  Skip
                </button>
                <button
                  onClick={handleNextStep2}
                  className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm transition active:scale-95 flex items-center gap-1.5 shadow-sm shadow-green-500/10"
                >
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: RECEIVABLES SETUP */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white">People Who Owe You</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Enter details of money lent out. If you don't have any receivables, press Finish.</p>
            </div>

            {/* Consumer setup grid */}
            <ReceivableSetupGrid onChange={setReceivablesPayload} />

            {error && <div className="text-xs text-red-500 font-bold text-center leading-normal">{error}</div>}

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handleBackStep3}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-black/[0.05] dark:border-white/[0.05] text-slate-600 dark:text-zinc-400 font-bold text-xs sm:text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition active:scale-95"
              >
                <ArrowLeft size={16} /> Back
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setModal("SKIP_RECEIVABLES")}
                  className="px-5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] text-slate-700 dark:text-zinc-300 font-bold text-xs sm:text-sm hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition active:scale-95"
                >
                  Skip
                </button>
                <button
                  onClick={handleFinishStep3}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-black font-bold text-xs sm:text-sm transition active:scale-95 flex items-center gap-1.5 shadow-sm shadow-green-500/10"
                >
                  {loading ? "Saving..." : "Finish"} <Check size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <footer className="relative z-10 h-16 flex items-center justify-center shrink-0">
        <span className="text-[10px] sm:text-xs text-slate-400">© 2026 My Finance. All rights reserved.</span>
      </footer>

      {/* Dynamic Warning Confirmation overlays */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/75 dark:bg-black/60 border border-black/[0.05] dark:border-white/[0.05] text-black dark:text-white backdrop-blur-xl rounded-3xl p-6 w-full max-w-[340px] text-center shadow-2xl flex flex-col gap-4 animate-modalIn">
            
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
                    setDebtsPayload([]);
                    setStep(1);
                    setModal(null);
                  } else if (modal === "BACK_RECEIVABLES") {
                    setKeepPayloads();
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition active:scale-95"
              >
                {modal.startsWith("SKIP") ? "Skip" : "Discard"}
              </button>

              <button
                onClick={() => setModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm transition"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );

  function setKeepPayloads() {
    setReceivablesPayload([]);
    setStep(2);
    setModal(null);
  }
}