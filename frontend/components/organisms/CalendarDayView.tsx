import BackButton from "@/frontend/components/atoms/BackButton";
import DayTransactionItem from "@/frontend/components/molecules/DayTransactionItem";
import type { Transaction } from "@/shared/apiTypes";

type CalendarDayViewProps = {
  dateKey: string;
  transactions: Transaction[];
  onBack: () => void;
};

// All top-level transactions recorded on one day
export default function CalendarDayView({ dateKey, transactions, onBack }: CalendarDayViewProps) {
  const title = new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="w-full px-2 sm:px-4 space-y-6 animate-fadeIn pb-16">
      <div className="flex items-center gap-3">
        <BackButton onClick={onBack} label="Back to month" />
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black dark:text-white">{title}</h1>
      </div>

      <div className="space-y-3">
        {transactions.map((t) => (
          <DayTransactionItem key={t.id} transaction={t} />
        ))}

        {transactions.length === 0 && (
          <div className="text-center text-gray-400 dark:text-zinc-500 py-16 text-sm">Transactions for this day will appear here.</div>
        )}
      </div>
    </div>
  );
}
