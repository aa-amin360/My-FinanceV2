import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onChange: (page: number) => void;
};

const BUTTON_CLASS =
  "p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition";

// "Page X of Y" footer with previous/next buttons; hidden when there is one page
export default function Pagination({ page, totalPages, disabled = false, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const go = (next: number) => {
    onChange(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.05] dark:border-white/[0.04]">
      <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
        Page {page} of {totalPages}
      </div>

      <div className="flex gap-2">
        <button disabled={page === 1 || disabled} onClick={() => go(page - 1)} className={BUTTON_CLASS}>
          <ChevronLeft size={18} />
        </button>
        <button disabled={page === totalPages || disabled} onClick={() => go(page + 1)} className={BUTTON_CLASS}>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
