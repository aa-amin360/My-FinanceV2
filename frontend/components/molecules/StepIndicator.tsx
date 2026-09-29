type StepIndicatorProps = {
  step: number;
  total: number;
};

// "Step 2 of 3" with a row of progress dots
export default function StepIndicator({ step, total }: StepIndicatorProps) {
  return (
    <div className="flex justify-between items-center px-4">
      <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
        Step {step} of {total}
      </span>
      <div className="flex gap-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${step >= i + 1 ? "bg-green-500" : "bg-black/[0.05] dark:bg-white/[0.05]"}`}
          />
        ))}
      </div>
    </div>
  );
}
