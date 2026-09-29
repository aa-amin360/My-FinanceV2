import ModalOverlay from "@/frontend/components/molecules/ModalOverlay";

export type OnboardingPrompt = "SKIP_BALANCES" | "SKIP_DEBTS" | "SKIP_RECEIVABLES" | "BACK_DEBTS" | "BACK_RECEIVABLES";

const MESSAGES: Record<OnboardingPrompt, string> = {
  SKIP_BALANCES: "Skipping means your account will start with zero balances. You can add existing balances later from Add History.",
  SKIP_DEBTS: "No debt records will be created. You can add them later from Add History.",
  SKIP_RECEIVABLES: "No receivable records will be created. You can add them later from Add History.",
  BACK_DEBTS: "You have unsaved entries. Going back will discard them.",
  BACK_RECEIVABLES: "You have unsaved entries. Going back will discard them.",
};

type OnboardingConfirmDialogProps = {
  prompt: OnboardingPrompt;
  onConfirm: () => void;
  onCancel: () => void;
};

// Asks before skipping a step or discarding entered rows
export default function OnboardingConfirmDialog({ prompt, onConfirm, onCancel }: OnboardingConfirmDialogProps) {
  const isSkip = prompt.startsWith("SKIP");

  return (
    <ModalOverlay>
      <div className="bg-white/75 dark:bg-black/60 border border-black/[0.05] dark:border-white/[0.05] text-black dark:text-white backdrop-blur-xl rounded-3xl p-6 w-full max-w-[340px] text-center shadow-2xl flex flex-col gap-4 animate-modalIn">
        <h3 className="text-lg font-bold text-black dark:text-white">{isSkip ? "Are you sure?" : "Discard Changes?"}</h3>

        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{MESSAGES[prompt]}</p>

        <div className="flex gap-3 justify-center mt-2">
          <button onClick={onConfirm} className="px-4 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition active:scale-95">
            {isSkip ? "Skip" : "Discard"}
          </button>

          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
