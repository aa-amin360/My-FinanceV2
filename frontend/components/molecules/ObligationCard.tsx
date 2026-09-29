import type { ObligationConfig } from "@/frontend/lib/obligationConfig";
import { formatMoney } from "@/shared/config";
import { formatName } from "@/shared/ledger";
import type { ObligationRow } from "@/shared/apiTypes";

type ObligationCardProps = {
  row: ObligationRow;
  config: ObligationConfig;
  onOpen: () => void;
  onSettle: () => void;
};

// Counterparty with the outstanding amount and a repay/receive button
export default function ObligationCard({ row, config, onOpen, onSettle }: ObligationCardProps) {
  return (
    <div
      onClick={onOpen}
      className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md p-5 rounded-3xl shadow-sm shadow-black/[0.01] flex justify-between items-center hover:bg-white/60 dark:hover:bg-black/45 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
    >
      <div>
        <div className="font-bold text-lg text-black dark:text-white">{formatName(row.name)}</div>
        <div className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Tap to view details</div>
      </div>

      <div className="text-right flex items-center gap-4">
        <div className={`${config.amountClass} font-extrabold text-lg sm:text-xl`}>{formatMoney(row.remaining_amount)}</div>

        <button
          onClick={(e) => {
            e.stopPropagation(); // don't also open the details page
            onSettle();
          }}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm active:scale-95 transition ${config.actionClass}`}
        >
          {config.actionLabel}
        </button>
      </div>
    </div>
  );
}
