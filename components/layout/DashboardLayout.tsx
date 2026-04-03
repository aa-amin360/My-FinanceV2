"use client";

import { useTheme } from "../ThemeProvider";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toggleTheme, theme } = useTheme();

  return (
    <div className="flex min-h-screen bg-white text-black dark:bg-slate-950 dark:text-white">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-100 dark:bg-slate-900 p-5 hidden md:flex flex-col gap-6">
        
        {/* HEADER */}
        <div>
          <h1 className="text-green-500 text-xl font-bold">My Finance</h1>

          {/* THEME TOGGLE */}
            <button
              onClick={toggleTheme}
              className="mt-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 hover:scale-105 transition-all"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
        </div>

        {/* NAV */}
        <nav className="flex flex-col gap-3 text-sm">
          <Item label="Dashboard" href="/" active />
          <Item label="Transactions" href="/transactions" />
          <Item label="Categories" href="/categories" />
          <Item label="Savings" href="/savings" />
          <Item label="Debt" href="/debt" />
          <Item label="Reports" href="/reports" />
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6">{children}</main>

      {/* RIGHT PANEL */}
      <aside className="w-80 bg-gray-100 dark:bg-slate-900 p-5 hidden lg:block">
        <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Insights
        </h3>

        <div className="bg-gray-200 dark:bg-slate-800 p-4 rounded-xl">
          Coming soon...
        </div>
      </aside>
    </div>
  );
}

// =========================
// SIDEBAR ITEM
// =========================

function Item({ label, href, active }: any) {
  return (
    <Link href={href}>
      <div
        className={`px-3 py-2 rounded-lg cursor-pointer transition ${
          active
            ? "bg-green-500 text-black font-semibold"
            : "hover:bg-gray-200 dark:hover:bg-slate-800"
        }`}
      >
        {label}
      </div>
    </Link>
  );
}
