import type { LucideIcon } from "lucide-react";

// Feature highlight with an icon, shown in the landing hero
export default function MiniCard({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="flex gap-3 p-3.5 rounded-2xl bg-[#131B21]/45 border border-white/[0.04] backdrop-blur-md shadow-sm">
      <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 shadow-inner border border-green-500/10">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-xs font-bold text-slate-200 truncate">{title}</h4>
        <p className="text-[10px] text-zinc-500 mt-0.5 truncate leading-normal">{desc}</p>
      </div>
    </div>
  );
}
