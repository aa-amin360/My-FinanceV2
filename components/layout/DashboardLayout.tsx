"use client";

import { useTheme } from "../ThemeProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Space_Grotesk } from "next/font/google";
import { signOut } from "next-auth/react";

import TransactionModal from "@/components/modal/TransactionModal";

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  Wallet,
  CreditCard,
  BarChart3,
  PanelLeftClose,
  PanelRightClose,
  Home,
  CalendarDays,
  History,
  LogOut,
  TrendingUp,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toggleTheme, theme } = useTheme();
  const pathname = usePathname();

  const [cashBalance, setCashBalance] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);

  // Safe default for both SSR and initial client-side hydration
  const [collapsed, setCollapsed] = useState(false); 

  // Run once on mount (client-only) to restore the saved state without hydration conflicts
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed") === "true";
    setCollapsed(saved);
  }, []);

  // Update localStorage only when the user explicitly clicks the button
  const handleToggleCollapse = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem("sidebar-collapsed", String(nextState));
  };

  // ================= LOAD BALANCE =================
  useEffect(() => {
    const loadBalance = async () => {
      const res = await fetch("/api/balance");
      const data = await res.json();

      setCashBalance(Number(data.cashBalance || 0));
      setBankBalance(Number(data.bankBalance || 0));
    };

    loadBalance();

    window.addEventListener("refreshData", loadBalance);
    return () => window.removeEventListener("refreshData", loadBalance);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#E7EBED] text-black dark:bg-[#131B21] dark:text-white transition-colors duration-300">

      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <aside
        className={`hidden md:flex ${
          collapsed ? "w-16" : "w-56"
        } h-full bg-slate-50/50 dark:bg-[#2A3439]/40 border-r border-slate-100 dark:border-zinc-900/60 flex-col transition-all duration-300`}
      >
        
        {/* Adjusted justify and margins to center the toggle button perfectly when collapsed */}
        <div className={`p-4 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <h2 className="text-sm font-semibold text-gray-400 tracking-widest">
              MENU
            </h2>
          )}

          <button
            onClick={handleToggleCollapse}
            className={`w-9 h-9 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition active:scale-95 ${collapsed ? "mx-auto" : ""}`}
          >
            {collapsed ? (
              <PanelRightClose size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>
        
        <div className={`flex-1 overflow-y-auto ${collapsed ? "px-1" : "px-2"}`}>
          <nav className={`flex flex-col ${collapsed ? "gap-3 mt-2" : "gap-2 mt-2"}`}>
            <Item icon={LayoutDashboard} label="Dashboard" href="/dashboard" pathname={pathname} collapsed={collapsed} />
            <Item icon={ArrowLeftRight} label="Transactions" href="/transactions" pathname={pathname} collapsed={collapsed} />
            <Item icon={TrendingUp} label="Planning" href="/budget" pathname={pathname} collapsed={collapsed} />
            <Item icon={Tag} label="Categories" href="/categories" pathname={pathname} collapsed={collapsed} />
            <Item icon={Wallet} label="Savings" href="/savings" pathname={pathname} collapsed={collapsed} />
            <Item icon={CreditCard} label="Debt" href="/debts" pathname={pathname} collapsed={collapsed} />
            <Item icon={Wallet} label="Receivable" href="/receivables" pathname={pathname} collapsed={collapsed} />
            <Item icon={BarChart3} label="Reports" href="/reports" pathname={pathname} collapsed={collapsed} />
            <Item icon={History} label="Add History" href="/add-history" pathname={pathname} collapsed={collapsed} />
          </nav>
        </div>
      </aside>

      {/* ================= MAIN PANEL ================= */}
      <div className="flex flex-col flex-1 h-full">
        
        {/* HEADER */}
        <div className="h-16 flex items-center justify-between px-6 bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-900 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center overflow-hidden">
              <img
                src="/logo.png"
                alt="logo"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-lg font-semibold text-green-500 tracking-wide">
              My Finance
            </h1>
          </div>
          
          {/* HEADER CONTROLS */}
          <div className="flex items-center gap-2">
            <Link
              href="/calendar"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 hover:scale-105 transition"
              aria-label="Calendar view"
            >
              <CalendarDays size={18} />
            </Link>
          
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 hover:scale-105 transition"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 hover:scale-105 transition"
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6">
          {children}
        </main>
      </div>

      {/* ================= MOBILE NAV ================= */}
      <FloatingNav pathname={pathname} />

      {/* ================= FAB ================= */}
      <button
        onClick={() => {
          if (pathname === "/debts") {
            window.dispatchEvent(new CustomEvent("openAdd", { detail: "DEBT" }));
          } else if (pathname === "/receivables") {
            window.dispatchEvent(new CustomEvent("openAdd", { detail: "RECEIVABLE" }));
          } else if (pathname === "/transactions") {
            window.dispatchEvent(new CustomEvent("openAdd", { detail: "TRANSACTION" }));
          } else {
            window.dispatchEvent(new CustomEvent("openAdd", { detail: "GENERAL" }));
          }
        }}
        className="fixed bottom-28 md:bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 text-black text-2xl flex items-center justify-center shadow-lg hover:scale-105 transition z-50"
      >
        +
      </button>

      {/* MODAL */}
      <TransactionModal />
    </div>
  );
}

// ================= SIDEBAR COMPONENTS ================= //

function Item({ label, href, pathname, icon: Icon, collapsed }: any) {
  const isActive =
    pathname === href || pathname.startsWith(href + "/");

  // Custom visual styles: Collapsed state uses a perfectly centered circular/squircle badge
  const containerStyle = collapsed
    ? `mx-auto w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
        isActive
          ? "bg-green-500/20 text-green-600 dark:text-green-400 shadow-[inset_0_1.5px_3px_rgba(34,197,94,0.06)] dark:shadow-[inset_0_1px_2.5px_rgba(255,255,255,0.04)] border border-green-500/10 scale-105"
          : "text-slate-400 dark:text-zinc-500 hover:bg-slate-100/50 dark:hover:bg-zinc-900/60 hover:text-black dark:hover:text-white"
      }`
    : `group relative flex items-center gap-3 px-4 py-2.5 rounded-r-xl border-l-4 transition-all duration-200 cursor-pointer ${
        isActive
          ? "bg-green-500/20 dark:bg-green-500/10 border-green-500 text-green-700 dark:text-green-400 font-bold"
          : "border-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 hover:text-black dark:hover:text-white hover:translate-x-1"
      }`;

  return (
    <Link href={href}>
      <div className={containerStyle}>
        <Icon size={collapsed ? 19 : 18} className="group-hover:scale-105 transition-transform duration-200 shrink-0" />
        {!collapsed && <span className="text-xs sm:text-sm tracking-wide">{label}</span>}
      </div>
    </Link>
  );
}

// ================= MOBILE NAV ================= //

function FloatingNav({ pathname }: { pathname: string }) {
  const items = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { label: "Planning", href: "/budget", icon: TrendingUp },
    { label: "Categories", href: "/categories", icon: Tag },
    { label: "Debt", href: "/debts", icon: CreditCard },
    { label: "Receivable", href: "/receivables", icon: Wallet },
    { label: "Add History", href: "/add-history", icon: History },
    { label: "Reports", href: "/reports", icon: BarChart3 },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md animate-fadeIn">
      {/* Scrollable Container with Hidden Scrollbars */}
      <div className="
        flex gap-3 items-center w-full px-4 py-2.5 rounded-full 
        bg-white/80 dark:bg-black/80 border border-gray-200 dark:border-slate-700 
        backdrop-blur-xl shadow-xl overflow-x-auto whitespace-nowrap
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
      ">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");

          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="shrink-0">
              <div
                className={`flex items-center justify-center gap-2 py-2 rounded-full transition shrink-0 ${
                  isActive
                    ? "bg-green-500 text-black px-4 scale-105"
                    : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-900 w-10 h-10"
                }`}
              >
                <Icon size={20} />
                <span className={`${isActive ? "block ml-1 font-semibold text-xs animate-fadeIn" : "hidden"}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}