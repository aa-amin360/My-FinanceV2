"use client";

import { useTheme } from "../ThemeProvider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  CalendarDays,
  History,
  LogOut,
  TrendingUp,
  Sun,
  Moon,
  Home
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [cashBalance, setCashBalance] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);

  const { toggleTheme, theme, collapsed, toggleCollapse } = useTheme();

  // Active Client-side Route Guard to intercept un-onboarded users
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const res = await fetch("/api/auth/onboarding");
        const data = await res.json();
        if (data.success && !data.history_initialized) {
          router.push("/onboarding");
        }
      } catch (err) {
        console.error("Onboarding gate check failed:", err);
      }
    };

    checkOnboardingStatus();
  }, [pathname, router]);

  // Load user balance streams dynamically on mounting
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
    <div className="relative flex h-screen overflow-hidden bg-[#E7EBED] text-black dark:bg-[#131B21] dark:text-white transition-colors duration-300">
      
      {/* Global Ambient Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,0,0,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.14),rgba(0,0,0,0))]" />

      {/* Sidebar navigation */}
      <aside
        className="relative z-10 hidden md:flex h-full bg-[#E7EBED]/45 dark:bg-[#131B21]/30 border-r border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md flex-col transition-all duration-300"
        style={{ width: collapsed ? "64px" : "240px" }}
      >
        <div className={`p-4 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <h2 className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase opacity-80">
              Navigation
            </h2>
          )}
          <button
            onClick={toggleCollapse}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition active:scale-95"
          >
            {collapsed ? <PanelRightClose size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        
        <div className={`flex-1 overflow-y-auto ${collapsed ? "px-1" : "px-2"}`}>
          <nav className="flex flex-col gap-1 mt-2">
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

      {/* Main Panel Content Container */}
      <div className="relative z-10 flex flex-col flex-1 h-full min-w-0">
        
        {/* Header bar controls */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 bg-white/40 dark:bg-black/30 border-b border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md relative z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-sm shadow-emerald-500/10 flex items-center justify-center overflow-hidden shrink-0">
              <img src="/logo.png" alt="logo" className="w-full h-full object-cover rounded-[10px]" />
            </div>
            <h1 className="text-sm sm:text-base tracking-tight font-black select-none leading-none truncate">
              <span className="text-zinc-900 dark:text-zinc-50 font-bold">My</span>
              <span className="text-emerald-500 ml-1 font-extrabold">Finance</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/calendar" className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] text-zinc-500 hover:text-emerald-500 transition-all active:scale-95">
              <CalendarDays size={16} />
            </Link>
            <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] text-zinc-500 active:scale-95 transition-all">
              {theme === "dark" ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}
            </button>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 transition-all active:scale-95">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic page main content body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-32 md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Floating Nav bar */}
      <FloatingNav pathname={pathname} />

      {/* Central Floating Action button mapped dynamically to router paths */}
      <button
        onClick={() => {
          if (pathname === "/debts") window.dispatchEvent(new CustomEvent("openAdd", { detail: "DEBT" }));
          else if (pathname === "/receivables") window.dispatchEvent(new CustomEvent("openAdd", { detail: "RECEIVABLE" }));
          else if (pathname === "/savings") window.dispatchEvent(new CustomEvent("openAdd", { detail: "NEW_GOAL" }));
          else if (pathname === "/transactions") window.dispatchEvent(new CustomEvent("openAdd", { detail: "TRANSACTION" }));
          else window.dispatchEvent(new CustomEvent("openAdd", { detail: "GENERAL" }));
        }}
        className="fixed bottom-24 md:bottom-8 right-4 sm:right-8 w-14 h-14 rounded-full bg-green-500 text-black text-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all z-50 shadow-green-500/30"
      >
        +
      </button>

      <TransactionModal />
    </div>
  );
}

// Side-Nav item element component
function Item({ label, href, pathname, icon: Icon, collapsed }: any) {
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const containerStyle = collapsed
    ? `mx-auto w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${isActive ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/10 scale-105 shadow-sm" : "text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`
    : `group flex items-center gap-3 px-4 py-2.5 rounded-r-xl border-l-4 transition-all duration-200 cursor-pointer ${isActive ? "bg-green-500/15 border-green-500 text-green-700 dark:text-green-400 font-bold" : "border-transparent text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 hover:translate-x-1"}`;

  return (
    <Link href={href}>
      <div className={containerStyle}>
        <Icon size={collapsed ? 20 : 18} className="shrink-0" />
        {!collapsed && <span className="text-xs sm:text-sm tracking-wide truncate">{label}</span>}
      </div>
    </Link>
  );
}

// Mobile persistent floating menu component
function FloatingNav({ pathname }: { pathname: string }) {
  const items = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { label: "Planning", href: "/budget", icon: TrendingUp },
    { label: "Categories", href: "/categories", icon: Tag },
    { label: "Savings", href: "/savings", icon: Wallet },
    { label: "Debt", href: "/debts", icon: CreditCard },
    { label: "Receivable", href: "/receivables", icon: Wallet },
    { label: "History", href: "/add-history", icon: History },
    { label: "Reports", href: "/reports", icon: BarChart3 },
  ];

  useEffect(() => {
    const activeElement = document.getElementById("active-nav-pill");
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
    }
  }, [pathname]);

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md">
      <div className="flex gap-2 items-center w-full px-3 py-2 rounded-full bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 backdrop-blur-xl shadow-2xl overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} id={isActive ? "active-nav-pill" : undefined} className="shrink-0">
              <div className={`flex items-center justify-center gap-2 py-2 rounded-full transition-all duration-300 ${isActive ? "bg-green-500 text-black px-5 shadow-lg" : "text-slate-500 w-11 h-11"}`}>
                <item.icon size={20} />
                {isActive && <span className="font-bold text-xs">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}