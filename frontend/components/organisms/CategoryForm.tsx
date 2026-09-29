import FieldLabel from "@/frontend/components/atoms/FieldLabel";
import Dropdown from "@/frontend/components/molecules/Dropdown";

const TYPE_OPTIONS = [
  { value: "EXPENSE", label: "Expense" },
  { value: "INCOME", label: "Income" },
];

type CategoryFormProps = {
  name: string;
  type: "EXPENSE" | "INCOME";
  onNameChange: (name: string) => void;
  onTypeChange: (type: "EXPENSE" | "INCOME") => void;
  onSubmit: () => void;
};

// Inline "new category" row: name, type and add button
export default function CategoryForm({ name, type, onNameChange, onTypeChange, onSubmit }: CategoryFormProps) {
  return (
    // relative z-20 keeps the type dropdown above the table below
    <div className="bg-white/45 dark:bg-black/30 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md p-4 rounded-3xl shadow-sm shadow-black/[0.01] grid grid-cols-12 gap-3 items-end relative z-20">
      <div className="col-span-12 sm:col-span-6 flex flex-col gap-1.5 text-left">
        <FieldLabel as="span" inset>
          Category Name
        </FieldLabel>
        <input
          placeholder="e.g. Food, Groceries, Salary"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full h-[46px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm rounded-2xl px-4 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm"
        />
      </div>

      <div className="col-span-12 sm:col-span-4">
        <Dropdown label="Category Type" options={TYPE_OPTIONS} selectedValue={type} onChange={onTypeChange} />
      </div>

      <button
        onClick={onSubmit}
        className="col-span-12 sm:col-span-2 h-[46px] w-full bg-green-500 hover:bg-green-400 active:scale-95 transition-all duration-200 text-black font-bold text-sm rounded-2xl shrink-0 shadow-md shadow-green-500/10"
      >
        Add Category
      </button>
    </div>
  );
}
