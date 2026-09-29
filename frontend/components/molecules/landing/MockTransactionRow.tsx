// Sample transaction row inside the phone mockup
export default function MockTransactionRow({ name, type, val, isPositive }: { name: string, type: string, val: string, isPositive: boolean }) {
  return (
    <div className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-900/60 flex justify-between items-center text-[7.5px] leading-none font-bold">
      <div className="min-w-0 flex-1">
        <p className="text-zinc-200 truncate">{name}</p>
        <p className="text-zinc-600 text-[6.5px] mt-0.5">{type}</p>
      </div>
      <span className={isPositive ? "text-green-400" : "text-red-400"}>
        {val}
      </span>
    </div>
  );
}
