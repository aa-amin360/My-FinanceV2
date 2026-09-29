import FieldLabel from "@/frontend/components/atoms/FieldLabel";

export type TransferDirection = "TO_SAVINGS" | "FROM_SAVINGS";

type DirectionToggleProps = {
  value: TransferDirection;
  onChange: (value: TransferDirection) => void;
};

const OPTIONS: { value: TransferDirection; label: string }[] = [
  { value: "TO_SAVINGS", label: "To Savings" },
  { value: "FROM_SAVINGS", label: "From Savings" },
];

// Chooses whether a transfer moves money into or out of Savings
export default function DirectionToggle({ value, onChange }: DirectionToggleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>Direction</FieldLabel>
      <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-2xl">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition ${value === option.value ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
