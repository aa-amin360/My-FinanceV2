import { Moon, Sun } from "lucide-react";

type ThemeSwitchProps = {
  theme: string;
  onToggle: () => void;
};

// Sliding light/dark toggle
export default function ThemeSwitch({ theme, onToggle }: ThemeSwitchProps) {
  const dark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      type="button"
      className="relative w-12 h-6 rounded-full transition-colors duration-300 bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.05] focus:outline-none shrink-0"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute top-[1.5px] left-[1px] w-5 h-5 rounded-full bg-white dark:bg-zinc-800 shadow-md flex items-center justify-center text-zinc-500 dark:text-yellow-400 transition-transform duration-300 ${dark ? "translate-x-6" : "translate-x-0"}`}
      >
        {dark ? <Moon size={11} /> : <Sun size={11} />}
      </div>
    </button>
  );
}
