import { RotateCcw, Search } from "lucide-react";
import GlassCalendar from "@/frontend/components/molecules/GlassCalendar";

type TransactionFiltersProps = {
  search: string;
  startDate: string;
  endDate: string;
  onSearchChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onReset: () => void;
};

// Search box, date range and reset button above the transactions list
export default function TransactionFilters({
  search,
  startDate,
  endDate,
  onSearchChange,
  onStartDateChange,
  onEndDateChange,
  onReset,
}: TransactionFiltersProps) {
  return (
    <div className="grid grid-cols-12 gap-2 sm:gap-3 mb-6 items-center">
      <div className="relative col-span-10 md:col-span-5 group order-1">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none z-20"
        />
        <input
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all h-[46px] relative z-10"
        />
      </div>

      <button
        onClick={onReset}
        title="Reset Filters"
        className="col-span-2 md:col-span-2 h-[46px] flex items-center justify-center gap-2 rounded-2xl bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95 order-2 md:order-3"
      >
        <RotateCcw size={18} />
        <span className="hidden lg:inline text-xs font-bold uppercase tracking-wider">Reset</span>
      </button>

      <div className="col-span-12 md:col-span-5 grid grid-cols-2 gap-2 order-3 md:order-2">
        <GlassCalendar value={startDate} onChange={onStartDateChange} placeholder="Start Date" />
        <GlassCalendar value={endDate} onChange={onEndDateChange} placeholder="End Date" />
      </div>
    </div>
  );
}
