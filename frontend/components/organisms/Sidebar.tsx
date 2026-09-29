import { PanelLeftClose, PanelRightClose } from "lucide-react";
import SidebarNavItem from "@/frontend/components/molecules/SidebarNavItem";
import { isActivePath, SIDEBAR_ITEMS } from "@/frontend/lib/navigation";

type SidebarProps = {
  pathname: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

// Collapsible desktop navigation
export default function Sidebar({ pathname, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className="relative z-10 hidden md:flex h-full bg-[#E7EBED]/45 dark:bg-[#131B21]/30 border-r border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md flex-col transition-all duration-300"
      style={{ width: collapsed ? "64px" : "240px" }}
    >
      <div className={`p-4 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && <h2 className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase opacity-80">Navigation</h2>}
        <button
          onClick={onToggleCollapse}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition active:scale-95"
        >
          {collapsed ? <PanelRightClose size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto ${collapsed ? "px-1" : "px-2"}`}>
        <nav className="flex flex-col gap-1 mt-2">
          {SIDEBAR_ITEMS.map((item) => (
            <SidebarNavItem key={item.href} item={item} active={isActivePath(pathname, item.href)} collapsed={collapsed} />
          ))}
        </nav>
      </div>
    </aside>
  );
}
