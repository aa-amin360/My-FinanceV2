import { formatMoney } from "@/shared/config";

type ProjectionBlockProps = {
  label: string;
  value: number;
  color: string;
  // Shown before positive values, e.g. "+" or "-"
  prefix?: string;
};

// Labelled amount tile inside the budget projection summary
export default function ProjectionBlock({ label, value, color, prefix = "" }: ProjectionBlockProps) {
  return (
    <div className="bg-slate-50/50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-900/60 p-3 sm:p-5 rounded-2xl flex flex-col text-left shadow-[inset_0_2px_4px_rgba(0,0,0,0.015)] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.015)] w-full overflow-hidden">
      <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-400 dark:text-zinc-500 leading-tight truncate">{label}</span>
      <span className={`text-sm sm:text-lg md:text-xl lg:text-2xl font-bold ${color} mt-1.5 whitespace-nowrap`}>
        {value > 0 ? prefix : ""}
        {formatMoney(value)}
      </span>
    </div>
  );
}
