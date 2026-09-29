import { formatCompact } from "@/frontend/lib/format";
import { formatNumber } from "@/shared/config";

type CalendarDayCellProps = {
  day: number;
  income: number;
  expense: number;
  onSelect: () => void;
};

// One day in the month grid with its income/expense totals
export default function CalendarDayCell({ day, income, expense, onSelect }: CalendarDayCellProps) {
  return (
    <div
      onClick={onSelect}
      className="aspect-square p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl cursor-pointer transition flex flex-col justify-between bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md shadow-sm shadow-black/[0.01] shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)] hover:border-emerald-500 dark:hover:border-emerald-500/80 hover:bg-white/60 dark:hover:bg-black/45 hover:scale-[1.02] active:scale-95"
    >
      <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-zinc-300 self-end leading-none">{day}</span>

      {/* Fixed-height metric slots keep every cell the same size */}
      <div className="h-6 sm:h-8 flex flex-col justify-end text-left w-full overflow-hidden mt-auto">
        <div className="h-3 sm:h-4 flex items-center">
          {income > 0 ? (
            <div className="text-emerald-600 dark:text-emerald-400 font-bold truncate leading-none w-full">
              <span className="md:hidden text-[7.5px] tracking-tighter block leading-none">+{formatCompact(income)}</span>
              <span className="hidden md:block text-[10px] leading-none">+{formatNumber(income)}</span>
            </div>
          ) : (
            <div className="h-full w-full" />
          )}
        </div>

        <div className="h-3 sm:h-4 flex items-center">
          {expense > 0 ? (
            <div className="text-rose-500 dark:text-rose-400 font-bold truncate leading-none w-full">
              <span className="md:hidden text-[7.5px] tracking-tighter block leading-none">-{formatCompact(expense)}</span>
              <span className="hidden md:block text-[10px] leading-none">-{formatNumber(expense)}</span>
            </div>
          ) : (
            <div className="h-full w-full" />
          )}
        </div>
      </div>
    </div>
  );
}
