type RefundGoalDialogProps = {
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

// Confirms deleting a goal and returning its saved money to Cash/Bank
export default function RefundGoalDialog({ loading, onConfirm, onClose }: RefundGoalDialogProps) {
  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[340px] sm:max-w-[400px] bg-white dark:bg-[#0d1318] border border-black/10 dark:border-white/10 rounded-[32px] p-5 sm:p-6 shadow-2xl animate-modalIn relative text-center"
      >
        <h3 className="text-lg font-bold mb-2">Cancel & Delete Goal?</h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
          This will remove the goal. All saved funds currently allocated to this goal will be automatically refunded back to your primary accounts (Cash/Bank).
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition active:scale-95 text-xs shadow-sm shadow-red-500/10"
          >
            {loading ? "Refunding..." : "Delete & Refund"}
          </button>
          <button onClick={onClose} className="flex-1 py-3 bg-black/5 dark:bg-white/5 text-slate-600 dark:text-zinc-400 font-bold rounded-2xl transition text-xs">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
