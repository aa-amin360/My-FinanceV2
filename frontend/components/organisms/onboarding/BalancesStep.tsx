import { ArrowRight } from "lucide-react";
import TextInput from "@/frontend/components/atoms/TextInput";

type BalancesStepProps = {
  cashBalance: string;
  bankBalance: string;
  onCashChange: (value: string) => void;
  onBankChange: (value: string) => void;
  onSkip: () => void;
  onNext: () => void;
};

// Onboarding step 1: opening Cash and Bank balances
export default function BalancesStep({ cashBalance, bankBalance, onCashChange, onBankChange, onSkip, onNext }: BalancesStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white">Set Your Current Balances</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Establish the cash and bank holdings you have on hand today. You can add more later.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Cash Balance</label>
          <TextInput type="number" placeholder="0.00" value={cashBalance} onChange={(e) => onCashChange(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Bank Balance</label>
          <TextInput type="number" placeholder="0.00" value={bankBalance} onChange={(e) => onBankChange(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={onSkip}
          className="px-5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] text-slate-700 dark:text-zinc-300 font-bold text-xs sm:text-sm hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition active:scale-95"
        >
          Skip
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm transition active:scale-95 flex items-center gap-1.5 shadow-sm shadow-green-500/10"
        >
          Next <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
