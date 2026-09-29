type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

// Pill group where exactly one option is active (e.g. All / This Year / This Month)
export default function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-inner">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 duration-200 shrink-0 ${
            option.value === value
              ? "bg-green-500 text-black shadow-md shadow-green-500/10"
              : "bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] text-slate-700 dark:text-zinc-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
