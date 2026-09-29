// Tagline and copyright
export default function LandingFooter() {
  return (
    <footer className="relative z-10 h-20 border-t border-zinc-900/50 flex flex-col justify-center items-center gap-1 shrink-0 bg-black/10 px-4">
      <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider text-center">
        Track income, expenses, debts and savings in one place
      </span>
      <span className="text-[9px] text-slate-600">© 2026 My Finance. All rights reserved.</span>
    </footer>
  );
}
