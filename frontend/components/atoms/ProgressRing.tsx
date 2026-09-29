const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Circular progress indicator with the percentage in the middle (0-100)
export default function ProgressRing({ progress }: { progress: number }) {
  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
      <svg className="w-16 h-16 transform -rotate-90">
        <circle cx="32" cy="32" r={RADIUS} className="text-black/5 dark:text-white/5 stroke-current" strokeWidth="3.5" fill="transparent" />
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          className="text-indigo-500 stroke-current transition-all duration-1000 ease-out"
          strokeWidth="3.5"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[11px] font-black text-black dark:text-white">{progress.toFixed(0)}%</span>
      </div>
    </div>
  );
}
