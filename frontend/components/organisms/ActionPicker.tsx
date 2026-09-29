import CloseButton from "@/frontend/components/atoms/CloseButton";
import ActionCard from "@/frontend/components/molecules/ActionCard";
import type { TransactionAction } from "@/frontend/lib/transactionActions";

type ActionPickerProps = {
  onPick: (action: TransactionAction) => void;
  onClose: () => void;
};

// First step of the transaction modal: choose the kind of entry
export default function ActionPicker({ onPick, onClose }: ActionPickerProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-black dark:text-white leading-none">Select Action</h3>
        <CloseButton onClick={onClose} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ActionCard label="Income" onClick={() => onPick("INCOME")} />
        <ActionCard label="Expense" onClick={() => onPick("EXPENSE")} />
        <ActionCard label="Borrow" onClick={() => onPick("BORROW")} />
        <ActionCard label="Give" onClick={() => onPick("GIVE")} />
        <div className="col-span-2">
          <ActionCard label="Transfer" onClick={() => onPick("TRANSFER")} />
        </div>
      </div>

      <button
        onClick={onClose}
        className="text-xs font-bold text-slate-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition mt-1 text-center"
      >
        Cancel
      </button>
    </>
  );
}
