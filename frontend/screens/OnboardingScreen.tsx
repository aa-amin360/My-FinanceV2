"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "@/frontend/components/molecules/StepIndicator";
import ThemeSwitch from "@/frontend/components/molecules/ThemeSwitch";
import type { SetupEntry } from "@/frontend/components/organisms/EntrySetupGrid";
import BalancesStep from "@/frontend/components/organisms/onboarding/BalancesStep";
import EntriesStep from "@/frontend/components/organisms/onboarding/EntriesStep";
import OnboardingConfirmDialog, { OnboardingPrompt } from "@/frontend/components/organisms/onboarding/OnboardingConfirmDialog";
import { authApi } from "@/frontend/api/auth";
import { errorMessage } from "@/frontend/api/client";
import { historyApi } from "@/frontend/api/history";
import { requestRefresh } from "@/frontend/lib/events";
import { setOnboardingCached } from "@/frontend/lib/onboardingCache";
import { useTheme } from "@/frontend/providers/ThemeProvider";
import { localDateString } from "@/shared/config";
import Presence from "@/frontend/components/atoms/Presence";

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [prompt, setPrompt] = useState<OnboardingPrompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [cashBalance, setCashBalance] = useState("");
  const [bankBalance, setBankBalance] = useState("");
  const [debts, setDebts] = useState<SetupEntry[]>([]);
  const [receivables, setReceivables] = useState<SetupEntry[]>([]);

  // Users who already finished onboarding go straight to the dashboard
  useEffect(() => {
    authApi
      .onboardingStatus()
      .then((onboarded) => {
        if (onboarded) {
          setOnboardingCached(true);
          router.push("/dashboard");
        }
      })
      .catch((err) => console.error("Onboarding exit check failed:", err));
  }, [router]);

  const submit = async () => {
    setPrompt(null);
    setLoading(true);
    setError("");

    try {
      await historyApi.save({
        cashBalance: cashBalance ? Number(cashBalance) : 0,
        bankBalance: bankBalance ? Number(bankBalance) : 0,
        debts,
        receivables,
        date: localDateString(),
      });
      await authApi.completeOnboarding();

      setOnboardingCached(true);
      requestRefresh();
      router.push("/dashboard");
    } catch (err) {
      setError(errorMessage(err, "Failed to save starting positions."));
      setLoading(false);
    }
  };

  // What confirming each prompt does
  const confirmPrompt = () => {
    switch (prompt) {
      case "SKIP_BALANCES":
        setStep(2);
        break;
      case "SKIP_DEBTS":
        setStep(3);
        break;
      case "SKIP_RECEIVABLES":
        submit();
        return;
      case "BACK_DEBTS":
        setDebts([]);
        setStep(1);
        break;
      case "BACK_RECEIVABLES":
        setReceivables([]);
        setStep(2);
        break;
    }
    setPrompt(null);
  };

  return (
    <div className="relative min-h-screen bg-[#E7EBED] dark:bg-[#131B21] text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 transition-colors duration-300">
      {/* Ambient glow */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,0,0,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.14),rgba(0,0,0,0))]" />

      <header className="relative z-10 max-w-xl w-full mx-auto h-16 flex items-center justify-between shrink-0 px-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center text-black font-extrabold text-sm shadow-md shadow-green-500/10">M</div>
          <span className="font-extrabold text-sm tracking-wide text-green-500">My Finance</span>
        </div>
        <ThemeSwitch theme={theme} onToggle={toggleTheme} />
      </header>

      <div className="relative z-10 w-full max-w-xl mx-auto bg-white/75 dark:bg-black/60 border border-black/[0.05] dark:border-white/[0.05] backdrop-blur-xl rounded-3xl p-4 sm:p-8 shadow-2xl flex flex-col gap-6 animate-modalIn">
        <StepIndicator step={step} total={3} />

        {step === 1 && (
          <BalancesStep
            cashBalance={cashBalance}
            bankBalance={bankBalance}
            onCashChange={setCashBalance}
            onBankChange={setBankBalance}
            onSkip={() => setPrompt("SKIP_BALANCES")}
            onNext={() => (!cashBalance && !bankBalance ? setPrompt("SKIP_BALANCES") : setStep(2))}
          />
        )}

        {step === 2 && (
          <EntriesStep
            title="People You Owe"
            description="Enter any outstanding loans or debts you currently owe. Press Next if you don't have any."
            label="Debts"
            onEntriesChange={setDebts}
            onBack={() => (debts.length > 0 ? setPrompt("BACK_DEBTS") : setStep(1))}
            onSkip={() => setPrompt("SKIP_DEBTS")}
            onNext={() => (debts.length === 0 ? setPrompt("SKIP_DEBTS") : setStep(3))}
          />
        )}

        {step === 3 && (
          <EntriesStep
            title="People Who Owe You"
            description="Enter details of money lent out. If you don't have any receivables, press Finish."
            label="Receivables"
            onEntriesChange={setReceivables}
            onBack={() => (receivables.length > 0 ? setPrompt("BACK_RECEIVABLES") : setStep(2))}
            onSkip={() => setPrompt("SKIP_RECEIVABLES")}
            onNext={() => (receivables.length === 0 ? setPrompt("SKIP_RECEIVABLES") : submit())}
            isLast
            loading={loading}
            error={error}
          />
        )}
      </div>

      <footer className="relative z-10 h-16 flex items-center justify-center shrink-0">
        <span className="text-[10px] sm:text-xs text-slate-400">© 2026 My Finance. All rights reserved.</span>
      </footer>

      <Presence show={!!prompt}>
        {prompt && <OnboardingConfirmDialog prompt={prompt} onConfirm={confirmPrompt} onCancel={() => setPrompt(null)} />}
      </Presence>
    </div>
  );
}
