import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import EntrySetupGrid, { SetupEntry } from "@/frontend/components/organisms/EntrySetupGrid";

type EntriesStepProps = {
  title: string;
  description: ReactNode;
  // Plural label for the entry grid, e.g. "Debts"
  label: string;
  onEntriesChange: (entries: SetupEntry[]) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
  // The last step shows "Finish" and a saving state instead of "Next"
  isLast?: boolean;
  loading?: boolean;
  error?: string;
};

// Onboarding step for listing existing debts or receivables
export default function EntriesStep({
  title,
  description,
  label,
  onEntriesChange,
  onBack,
  onSkip,
  onNext,
  isLast = false,
  loading = false,
  error,
}: EntriesStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400">{description}</p>
      </div>

      <EntrySetupGrid label={label} onChange={onEntriesChange} />

      {error && <div className="text-xs text-red-500 font-bold text-center leading-normal">{error}</div>}

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-black/[0.05] dark:border-white/[0.05] text-slate-600 dark:text-zinc-400 font-bold text-xs sm:text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition active:scale-95"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="px-5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] text-slate-700 dark:text-zinc-300 font-bold text-xs sm:text-sm hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition active:scale-95"
          >
            Skip
          </button>
          {isLast ? (
            <button
              onClick={onNext}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-black font-bold text-xs sm:text-sm transition active:scale-95 flex items-center gap-1.5 shadow-sm shadow-green-500/10"
            >
              {loading ? "Saving..." : "Finish"} <Check size={16} />
            </button>
          ) : (
            <button
              onClick={onNext}
              className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm transition active:scale-95 flex items-center gap-1.5 shadow-sm shadow-green-500/10"
            >
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
