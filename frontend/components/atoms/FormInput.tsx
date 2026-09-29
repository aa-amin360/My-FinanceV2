import type { InputHTMLAttributes } from "react";

const BASE =
  "p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm";

// Hides the browser's up/down spinner on number inputs
const NO_SPINNER = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

// Rounded input used inside modal forms
export default function FormInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "className">) {
  return <input {...props} className={props.type === "number" ? `${BASE} ${NO_SPINNER}` : BASE} />;
}
