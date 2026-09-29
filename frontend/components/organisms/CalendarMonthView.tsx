import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import BackButton from "@/frontend/components/atoms/BackButton";
import CalendarDayCell from "@/frontend/components/molecules/CalendarDayCell";
import { dayKey, monthCells, WEEKDAY_LABELS } from "@/frontend/lib/calendar";
import { formatMonthYear } from "@/frontend/lib/format";

type DayTotals = { income: number; expense: number };

type CalendarMonthViewProps = {
  year: number;
  month: number;
  totalsFor: (dateKey: string) => DayTotals;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectDay: (dateKey: string) => void;
};

const NAV_BUTTON =
  "flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] text-slate-700 dark:text-zinc-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition active:scale-95";

// Month grid with daily income/expense totals
export default function CalendarMonthView({ year, month, totalsFor, onBack, onPrev, onNext, onSelectDay }: CalendarMonthViewProps) {
  return (
    <div className="w-full px-1 sm:px-4 space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} label="Back to dashboard" />
          <h1 className="text-2xl font-bold flex items-center gap-2 text-black dark:text-white tracking-tight">
            <Calendar size={22} className="text-emerald-500" /> {formatMonthYear(new Date(year, month, 1))}
          </h1>
        </div>

        <div className="flex gap-2 self-end sm:self-center">
          <button onClick={onPrev} className={NAV_BUTTON}>
            <ChevronLeft size={14} /> Prev
          </button>
          <button onClick={onNext} className={NAV_BUTTON}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 py-1">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {monthCells(year, month).map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square bg-black/[0.01] dark:bg-white/[0.01] border border-transparent rounded-xl sm:rounded-2xl" />;
          }
          const key = dayKey(year, month, day);
          const { income, expense } = totalsFor(key);
          return <CalendarDayCell key={`day-${day}`} day={day} income={income} expense={expense} onSelect={() => onSelectDay(key)} />;
        })}
      </div>
    </div>
  );
}
