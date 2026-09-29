import type { ObligationConfig } from "@/frontend/lib/obligationConfig";
import { formatMoney } from "@/shared/config";
import { formatName } from "@/shared/ledger";

type ObligationSummaryProps = {
  config: ObligationConfig;
  name: string;
  totalOrigin: number;
  totalSettled: number;
  remaining: number;
  onSettle: () => void;
};

// Totals for one counterparty: taken/given, repaid/received and what's left
export default function ObligationSummary({ config, name, totalOrigin, totalSettled, remaining, onSettle }: ObligationSummaryProps) {
  return (
    <div className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md p-6 rounded-3xl shadow-sm shadow-black/[0.01]">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-black dark:text-white leading-none">{formatName(name)}</h3>

        {name && remaining > 0 && (
          <button onClick={onSettle} className={`px-4 py-2 rounded-xl text-sm font-bold transition active:scale-95 ${config.actionClass}`}>
            {config.actionLabel}
          </button>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 dark:text-zinc-500">{config.originLabel}</span>
          <span className="text-black dark:text-white font-semibold">{formatMoney(totalOrigin)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400 dark:text-zinc-500">{config.settledLabel}</span>
          <span className="text-black dark:text-white font-semibold">{formatMoney(totalSettled)}</span>
        </div>

        <div className="flex justify-between pt-3 border-t border-black/[0.04] dark:border-white/[0.04]">
          <span className="text-slate-500 dark:text-zinc-400 font-bold">Remaining</span>
          <span className={`${config.amountClass} font-extrabold text-lg sm:text-xl`}>{formatMoney(remaining)}</span>
        </div>
      </div>
    </div>
  );
}
