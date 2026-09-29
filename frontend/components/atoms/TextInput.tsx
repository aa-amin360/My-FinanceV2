import type { InputHTMLAttributes } from "react";

// Translucent rounded input used across auth, onboarding and history forms
export default function TextInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "className">) {
  return (
    <input
      {...props}
      className="px-4 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm"
    />
  );
}
