import { X } from "lucide-react";
import ModalOverlay from "@/frontend/components/molecules/ModalOverlay";
import AddPlanForm from "@/frontend/components/organisms/AddPlanForm";
import type { Category } from "@/shared/apiTypes";

type AddPlanModalProps = {
  categories: Category[];
  onCategoryCreated: (category: Category) => void;
  onSuccess: () => void;
  onClose: () => void;
};

// Dialog wrapping the "Create Budget Plan" form
export default function AddPlanModal({ categories, onCategoryCreated, onSuccess, onClose }: AddPlanModalProps) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-[380px] bg-gradient-to-br from-white to-slate-50 dark:bg-gradient-to-br dark:from-[#0d1318] dark:to-[#080b0f] backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.06] text-black dark:text-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-modalIn relative">
        <div className="flex justify-between items-center border-b border-black/[0.04] dark:border-white/[0.04] pb-3">
          <h3 className="text-lg font-bold text-black dark:text-white leading-none">Create Budget Plan</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-black dark:hover:text-white transition rounded-full hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
            <X size={16} />
          </button>
        </div>

        <AddPlanForm categories={categories} onCategoryCreated={onCategoryCreated} onSuccess={onSuccess} onClose={onClose} />
      </div>
    </ModalOverlay>
  );
}
