import { ChevronDown } from "lucide-react";

// Expandable question/answer row
export default function FaqRow({ idx, openIdx, setOpenIdx, q, a }: { idx: number, openIdx: number | null, setOpenIdx: (i: number | null) => void, q: string, a: string }) {
  const isOpen = openIdx === idx;
  return (
    <div 
      onClick={() => setOpenIdx(isOpen ? null : idx)}
      className="p-4 sm:p-5 rounded-2xl bg-white/5 dark:bg-black/20 border border-black/[0.04] dark:border-white/[0.04] backdrop-blur-md cursor-pointer transition-all duration-200"
    >
      <div className="flex justify-between items-center gap-3">
        <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">{q}</h4>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </div>
      {isOpen && (
        <p className="text-xs text-slate-400 leading-relaxed pt-3 border-t border-slate-100 dark:border-zinc-900/40 mt-3 animate-fadeIn">
          {a}
        </p>
      )}
    </div>
  );
}
