import { X } from "lucide-react";
import ModalOverlay from "@/frontend/components/molecules/ModalOverlay";
import ProcessPlanForm from "@/frontend/components/organisms/ProcessPlanForm";
import { formatMoney } from "@/shared/config";
import type { BudgetPlan } from "@/shared/apiTypes";

type ProcessPlanModalProps = {
  plan: BudgetPlan;
  onSuccess: () => void;
  onClose: () => void;
};

// Dialog for confirming, partially paying, rescheduling or skipping a due plan
export default function ProcessPlanModal({ plan, onSuccess, onClose }: ProcessPlanModalProps) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-[360px] bg-gradient-to-br from-white to-slate-50 dark:bg-gradient-to-br dark:from-[#0d1318] dark:to-[#080b0f] border border-black/[0.05] dark:border-white/[0.05] text-black dark:text-white backdrop-blur-xl rounded-3xl p-5 sm:p-6 text-center shadow-2xl flex flex-col gap-4 animate-modalIn">
        <div className="border-b border-black/[0.04] dark:border-white/[0.04] pb-3 flex justify-between items-center text-left">
          <div>
            <h3 className="text-base font-bold text-black dark:text-white leading-none">{plan.target_name}</h3>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block mt-1">
              Due amount: {formatMoney(plan.amount)}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-black dark:hover:text-white transition rounded-full hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
            <X size={14} />
          </button>
        </div>

        <ProcessPlanForm plan={plan} onSuccess={onSuccess} onClose={onClose} />
      </div>
    </ModalOverlay>
  );
}
