// Tiny income/expense/savings figure inside the phone mockup
export default function MiniPill({ label, val, color }: { label: string, val: string, color: string }) {
  return (
    <div className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-900/80 flex flex-col text-[7px] leading-tight font-extrabold text-left">
      <span className="text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className={`${color} mt-0.5`}>{val}</span>
    </div>
  );
}
