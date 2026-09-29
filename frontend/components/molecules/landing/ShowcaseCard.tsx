import { Info } from "lucide-react";

// Feature explanation card in the landing features section
export default function ShowcaseCard({ title, metric, desc }: { title: string, metric: string, desc: string }) {
  return (
    <div className="p-6 rounded-3xl bg-white/5 dark:bg-black/20 border border-black/[0.04] dark:border-white/[0.04] backdrop-blur-md flex flex-col justify-between gap-4 shadow-sm hover:scale-[1.01] hover:border-green-500/20 transition-all duration-300">
      <div className="space-y-1.5">
        <h4 className="text-sm font-bold text-white tracking-wide">{title}</h4>
        <p className="text-[11px] text-slate-400 leading-normal">{desc}</p>
      </div>
      <div className="pt-3 border-t border-black/[0.03] dark:border-white/[0.03] flex items-center gap-1.5 text-[10px] font-bold text-green-500">
        <Info size={12} /> {metric}
      </div>
    </div>
  );
}
