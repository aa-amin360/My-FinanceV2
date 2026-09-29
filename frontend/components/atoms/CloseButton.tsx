import { X } from "lucide-react";

// Small round "×" button in modal headers
export default function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 dark:text-zinc-500 hover:text-black dark:hover:text-white bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] transition duration-150"
    >
      <X size={14} />
    </button>
  );
}
