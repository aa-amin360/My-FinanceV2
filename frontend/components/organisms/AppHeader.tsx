import Image from "next/image";
import Link from "next/link";
import { CalendarDays, LogOut, Moon, Sun } from "lucide-react";

type AppHeaderProps = {
  theme: string;
  onToggleTheme: () => void;
  onSignOut: () => void;
};

// Top bar with the logo, calendar shortcut, theme toggle and sign-out
export default function AppHeader({ theme, onToggleTheme, onSignOut }: AppHeaderProps) {
  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 bg-white/40 dark:bg-black/30 border-b border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md relative z-30">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-sm shadow-emerald-500/10 flex items-center justify-center overflow-hidden shrink-0">
          <Image src="/logo.png" alt="logo" width={32} height={32} className="w-full h-full object-cover rounded-[10px]" />
        </div>
        <h1 className="text-sm sm:text-base tracking-tight font-black select-none leading-none truncate">
          <span className="text-zinc-900 dark:text-zinc-50 font-bold">My</span>
          <span className="text-emerald-500 ml-1 font-extrabold">Finance</span>
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/calendar" className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] text-zinc-500 hover:text-emerald-500 transition-all active:scale-95">
          <CalendarDays size={16} />
        </Link>
        <button onClick={onToggleTheme} className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] text-zinc-500 active:scale-95 transition-all">
          {theme === "dark" ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}
        </button>
        <button onClick={onSignOut} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 transition-all active:scale-95">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
