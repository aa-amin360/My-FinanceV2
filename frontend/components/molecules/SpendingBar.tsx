import { formatMoney } from "@/shared/config";

type SpendingBarProps = {
  name: string;
  value: number;
  // Share of total spending, 0-100
  percent: number;
};

// Category name, amount and a thin bar showing its share of spending
export default function SpendingBar({ name, value, percent }: SpendingBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-black dark:text-white truncate max-w-[120px]">{name}</span>
        <span className="text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
          {formatMoney(value)} ({percent.toFixed(0)}%)
        </span>
      </div>
      <div className="h-1 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
        <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
