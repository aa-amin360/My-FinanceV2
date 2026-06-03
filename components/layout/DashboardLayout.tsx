"use client";

import { useTheme } from "../ThemeProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Space_Grotesk } from "next/font/google";

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
  History, // Added History icon
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

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

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
    <div className="flex h-screen overflow-hidden bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
      
      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <aside
        className={`hidden md:flex ${
          collapsed ? "w-16" : "w-56"
        } h-full bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-900 flex-col transition-all duration-300`}
      >
        <div className="p-4 flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-sm font-semibold text-gray-400 tracking-widest">
              MENU
            </h2>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition"
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
            {/* 🔥 Updated path from "/" to "/dashboard" */}
            <Item icon={LayoutDashboard} label="Dashboard" href="/dashboard" pathname={pathname} collapsed={collapsed} />
            <Item icon={ArrowLeftRight} label="Transactions" href="/transactions" pathname={pathname} collapsed={collapsed} />
            <Item icon={Tag} label="Categories" href="/categories" pathname={pathname} collapsed={collapsed} />
            <Item icon={Wallet} label="Savings" href="/savings" pathname={pathname} collapsed={collapsed} />
            <Item icon={CreditCard} label="Debt" href="/debts" pathname={pathname} collapsed={collapsed} />
            <Item icon={Wallet} label="Receivable" href="/receivables" pathname={pathname} collapsed={collapsed} />
            <Item icon={BarChart3} label="Reports" href="/reports" pathname={pathname} collapsed={collapsed} />
            {/* ✅ Added Add History to Desktop Sidebar */}
            <Item icon={History} label="Add History" href="/add-history" pathname={pathname} collapsed={collapsed} />
          </nav>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex flex-col flex-1 h-full">
        
        {/* HEADER */}
        <div className="h-16 flex items-center justify-between px-6 bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-900">
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
          
          {/* ✅ Calendar placement is kept exactly as is */}
          <div className="flex items-center gap-2">
            <Link
              href="/calendar"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 hover:scale-105 transition"
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

      {/* ✅ MODAL (EXTERNAL NOW) */}
      <TransactionModal />
    </div>
  );
}

// ================= SIDEBAR COMPONENTS ================= //

function Item({ label, href, pathname, icon: Icon, collapsed }: any) {
  const isActive =
    pathname === href || pathname.startsWith(href + "/");

  return (
    <Link href={href}>
      <div
        className={`flex items-center ${
          collapsed ? "justify-center w-full" : "gap-3 px-3"
        } py-2 rounded-lg cursor-pointer transition ${
          isActive
            ? "bg-green-500 text-black font-medium"
            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
        }`}
      >
        <Icon size={collapsed ? 20 : 18} />
        {!collapsed && <span>{label}</span>}
      </div>
    </Link>
  );
}

// ================= MOBILE NAV (HORIZONTALLY SCROLLABLE) ================= //

function FloatingNav({ pathname }: { pathname: string }) {
  const items = [
    { label: "Home", href: "/dashboard", icon: Home }, // Updated target to "/dashboard"
    { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { label: "Categories", href: "/categories", icon: Tag },
    { label: "Debt", href: "/debts", icon: CreditCard },
    { label: "Receivable", href: "/receivables", icon: Wallet },
    { label: "Add History", href: "/add-history", icon: History }, // Added Add History route
    { label: "Reports", href: "/reports", icon: BarChart3 },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md">
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
                <span className={`${isActive ? "block ml-1 font-semibold text-xs" : "hidden"}`}>
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
