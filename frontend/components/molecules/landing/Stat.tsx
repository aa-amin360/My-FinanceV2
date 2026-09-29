import type { LucideIcon } from "lucide-react";

// Icon + label/value pair in the landing hero footer
export default function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 mx-auto sm:mx-0">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black/25 text-green-500 flex items-center justify-center shrink-0 border border-white/[0.03] shadow-inner">
        <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-[8.5px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-wider truncate leading-none">{label}</p>
        <h4 className="text-xs sm:text-sm font-black text-slate-200 mt-1 leading-none">{value}</h4>
      </div>
    </div>
  );
}
