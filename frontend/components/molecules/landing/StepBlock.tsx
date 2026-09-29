// Numbered step in the "how it works" section
export default function StepBlock({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="relative p-6 rounded-3xl bg-black/10 border border-white/[0.02] flex flex-col gap-3">
      <span className="text-2xl font-black text-green-500/10 font-mono tracking-tight absolute top-4 right-6">{num}</span>
      <h4 className="text-sm font-bold text-white tracking-wide">{title}</h4>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
