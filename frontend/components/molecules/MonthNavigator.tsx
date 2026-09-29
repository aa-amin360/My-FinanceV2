import { ChevronLeft, ChevronRight } from "lucide-react";

type MonthNavigatorProps = {
  label: string;
  onPrev: () => void;
  onNext: () => void;
};

// Compact "‹ September 2026 ›" switcher
export default function MonthNavigator({ label, onPrev, onNext }: MonthNavigatorProps) {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-inner">
      <button onClick={onPrev} className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition text-zinc-500 hover:text-black dark:hover:text-white active:scale-95">
        <ChevronLeft size={16} />
      </button>
      <span className="text-xs sm:text-sm font-bold text-black dark:text-white px-2 min-w-[110px] text-center">{label}</span>
      <button onClick={onNext} className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition text-zinc-500 hover:text-black dark:hover:text-white active:scale-95">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
