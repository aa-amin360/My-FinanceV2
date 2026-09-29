import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  onClick: () => void;
  label?: string;
};

// Square glass button with a left arrow, used in page headers
export default function BackButton({ onClick, label = "Back" }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition active:scale-95 shrink-0"
    >
      <ArrowLeft size={18} className="text-black dark:text-white" />
    </button>
  );
}
