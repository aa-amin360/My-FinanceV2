"use client";

import { useTheme } from "../ThemeProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toggleTheme, theme } = useTheme();
  const pathname = usePathname();

  // ================= GLOBAL MODAL STATE =================
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"ACTION" | "FORM">("ACTION");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");

  // ================= EVENT LISTENER =================
  useEffect(() => {
    const handler = (e: any) => {
      setShowModal(true);

      // 🔹 FROM + BUTTON (STRING)
      if (typeof e.detail === "string") {
        if (e.detail === "DEBT") {
          setAction("BORROW");
          setStep("FORM");
        } else if (e.detail === "RECEIVABLE") {
          setAction("GIVE");
          setStep("FORM");
        } else {
          setStep("ACTION"); // dashboard / transactions
        }
      }

      // 🔹 FROM BUTTON ACTION (OBJECT)
      if (typeof e.detail === "object") {
        setStep("FORM");
        setEntity(e.detail.entity);

        if (e.detail.type === "DEBT_REPAID") {
          setAction("REPAY");
        }

        if (e.detail.type === "RECEIVABLE_RECEIVED") {
          setAction("RECEIVE");
        }
      }
    };

    window.addEventListener("openAdd", handler);
    return () => window.removeEventListener("openAdd", handler);
  }, []);

  return (
    <div className="flex min-h-screen bg-white text-black dark:bg-slate-950 dark:text-white">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-100 dark:bg-slate-900 p-5 hidden md:flex flex-col gap-6">
        
        {/* HEADER */}
        <div>
          <h1 className="text-green-500 text-xl font-bold">My Finance</h1>

          <button
            onClick={toggleTheme}
            className="mt-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 hover:scale-105 transition-all"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>

        {/* NAV */}
        <nav className="flex flex-col gap-3 text-sm">
          <Item label="Dashboard" href="/" pathname={pathname} />
          <Item label="Transactions" href="/transactions" pathname={pathname} />
          <Item label="Categories" href="/categories" pathname={pathname} />
          <Item label="Savings" href="/savings" pathname={pathname} />
          <Item label="Debt" href="/debts" pathname={pathname} />
          <Item label="Receivable" href="/receivables" pathname={pathname} />
          <Item label="Reports" href="/reports" pathname={pathname} />
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

      {/* FLOATING ACTION BUTTON */}
      <button
        onClick={() => {
          if (pathname === "/debts") {
            window.dispatchEvent(new CustomEvent("openAdd", { detail: "DEBT" }));
          } else if (pathname === "/receivables") {
            window.dispatchEvent(new CustomEvent("openAdd", { detail: "RECEIVABLE" }));
          } else if (pathname === "/transactions") {
            window.dispatchEvent(new CustomEvent("openAdd", { detail: "GENERAL" }));
          } else {
            window.dispatchEvent(new CustomEvent("openAdd", { detail: "GENERAL" }));
          }
        }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 text-black text-2xl flex items-center justify-center shadow-lg hover:scale-105 transition"
      >
        +
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      
          <div className="w-[340px] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-modalIn">
      
            {/* ACTION STEP */}
            {step === "ACTION" && (
              <>
                <h3 className="text-center text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Select Action
                </h3>
      
                <div className="grid grid-cols-2 gap-3 mt-2">
      
                  <ActionCard label="Income" onClick={() => { setAction("INCOME"); setStep("FORM"); }} color="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400" />
      
                  <ActionCard label="Expense" onClick={() => { setAction("EXPENSE"); setStep("FORM"); }} color="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" />
      
                  <ActionCard label="Borrow" onClick={() => { setAction("BORROW"); setStep("FORM"); }} color="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" />
      
                  <ActionCard label="Give" onClick={() => { setAction("GIVE"); setStep("FORM"); }} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400" />
      
                </div>
      
                <button
                  onClick={() => setShowModal(false)}
                  className="text-sm text-gray-500 dark:text-gray-400"
                >
                  Cancel
                </button>
              </>
            )}
      
            {/* FORM STEP */}
            {step === "FORM" && (
              <>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {action}
                </h3>
      
                <input className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800" placeholder="Amount" />
      
                <button
                  className="bg-green-500 text-black py-3 rounded-xl"
                  onClick={() => setShowModal(false)}
                >
                  Save
                </button>
      
                <button
                  className="bg-gray-200 dark:bg-slate-700 py-3 rounded-xl"
                  onClick={() => setStep("ACTION")}
                >
                  Back
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ================= SIDEBAR ITEM =================

function Item({
  label,
  href,
  pathname,
}: {
  label: string;
  href: string;
  pathname: string;
}) {
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <div
        className={`px-3 py-2 rounded-lg cursor-pointer transition ${
          isActive
            ? "bg-green-500 text-black font-semibold"
            : "hover:bg-gray-200 dark:hover:bg-slate-800"
        }`}
      >
        {label}
      </div>
    </Link>
  );
}

function ActionCard({ label, onClick, color }: any) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl text-center cursor-pointer transition active:scale-95 hover:scale-[1.03] ${color}`}
    >
      {label}
    </div>
  );
}
