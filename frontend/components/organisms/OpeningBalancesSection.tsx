import { AlertTriangle, CheckCircle2 } from "lucide-react";
import TextInput from "@/frontend/components/atoms/TextInput";
import SectionCard from "@/frontend/components/molecules/SectionCard";

type OpeningBalancesSectionProps = {
  // Opening balances can only be set once
  initialized: boolean;
  cashBalance: string;
  bankBalance: string;
  onCashChange: (value: string) => void;
  onBankChange: (value: string) => void;
};

// Opening Cash/Bank inputs, or a confirmation once they have been set
export default function OpeningBalancesSection({ initialized, cashBalance, bankBalance, onCashChange, onBankChange }: OpeningBalancesSectionProps) {
  return (
    <SectionCard title="Opening Balances">
      {initialized ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 animate-fadeIn">
          <CheckCircle2 size={18} className="shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">Balances are configured</span>
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
              <TextInput type="number" placeholder="0.00" value={cashBalance} onChange={(e) => onCashChange(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Starting Bank Balance</label>
              <TextInput type="number" placeholder="0.00" value={bankBalance} onChange={(e) => onBankChange(e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
