import { Award } from "lucide-react";

type AchieveGoalDialogProps = {
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

// Confirms marking a goal as achieved, which records its savings as an expense
export default function AchieveGoalDialog({ loading, onConfirm, onClose }: AchieveGoalDialogProps) {
  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[360px] bg-white dark:bg-[#0d1318] border border-black/10 dark:border-white/10 rounded-[32px] p-6 shadow-2xl animate-modalIn relative text-center flex flex-col gap-4"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
          <Award size={24} />
        </div>

        <h3 className="text-lg font-bold text-black dark:text-white">Congratulations!</h3>

        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-1">Are you ready to mark this goal as achieved and spent?</p>

        <div className="p-3 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl text-left">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 text-center">Ledger Reconciliation</p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            This will automatically convert your total saved balance for this goal into an <b>EXPENSE</b> transaction on your ledger, ensuring your cash flow and net worth remain completely balanced.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold rounded-2xl transition active:scale-95 text-xs shadow-md shadow-emerald-500/10"
          >
            {loading ? "Reconciling Ledger..." : "Yes, Mark as Achieved & Spent"}
          </button>

          <button onClick={onClose} className="w-full py-3 bg-black/5 dark:bg-white/5 text-slate-600 dark:text-zinc-400 font-bold rounded-2xl transition text-xs">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
