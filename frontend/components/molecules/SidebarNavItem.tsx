import Link from "next/link";
import type { NavItem } from "@/frontend/lib/navigation";

type SidebarNavItemProps = {
  item: NavItem;
  active: boolean;
  // Icon-only variant for the collapsed sidebar
  collapsed: boolean;
};

// One link in the desktop sidebar
export default function SidebarNavItem({ item, active, collapsed }: SidebarNavItemProps) {
  const Icon = item.icon;
  const className = collapsed
    ? `mx-auto w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${active ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/10 scale-105 shadow-sm" : "text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`
    : `group flex items-center gap-3 px-4 py-2.5 rounded-r-xl border-l-4 transition-all duration-200 cursor-pointer ${active ? "bg-green-500/15 border-green-500 text-green-700 dark:text-green-400 font-bold" : "border-transparent text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 hover:translate-x-1"}`;

  return (
    <Link href={item.href}>
      <div className={className}>
        <Icon size={collapsed ? 20 : 18} className="shrink-0" />
        {!collapsed && <span className="text-xs sm:text-sm tracking-wide truncate">{item.label}</span>}
      </div>
    </Link>
  );
}
