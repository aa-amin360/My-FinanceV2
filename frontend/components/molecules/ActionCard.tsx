const STYLES: Record<string, string> = {
  Income: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/30",
  Expense: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/30",
  Borrow: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/30",
  Give: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/30",
  Transfer: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/30",
};

// Colored tile for choosing what kind of transaction to add
export default function ActionCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl text-center cursor-pointer transition font-bold text-xs sm:text-sm active:scale-95 hover:scale-[1.03] ${STYLES[label]}`}
    >
      {label}
    </div>
  );
}
