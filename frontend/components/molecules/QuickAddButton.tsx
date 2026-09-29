import { openTransactionModal, TransactionModalShortcut } from "@/frontend/lib/events";

// Form the floating "+" button opens on each page
const QUICK_ADD_BY_PATH: Record<string, TransactionModalShortcut> = {
  "/debts": "DEBT",
  "/receivables": "RECEIVABLE",
  "/savings": "NEW_GOAL",
  "/transactions": "TRANSACTION",
};

// Floating "+" button that opens the most relevant add form for the current page
export default function QuickAddButton({ pathname }: { pathname: string }) {
  return (
    <button
      onClick={() => openTransactionModal(QUICK_ADD_BY_PATH[pathname] ?? "GENERAL")}
      className="fixed bottom-24 md:bottom-8 right-4 sm:right-8 w-14 h-14 rounded-full bg-green-500 text-black text-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all z-50 shadow-green-500/30"
    >
      +
    </button>
  );
}
