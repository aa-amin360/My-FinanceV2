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

  // ================= MODAL STATE =================
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"ACTION" | "FORM">("ACTION");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");

  // ================= FORM STATE =================
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("Cash");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  const [error, setError] = useState("");
  const [isDirectFlow, setIsDirectFlow] = useState(false);

  useEffect(() => {
    const refresh = async () => {
      const res = await fetch("/api/balance", { cache: "no-store" });
      const data = await res.json();
      setBalance(data.balance || 0);
    };
  
    window.addEventListener("refreshData", refresh);
  
    return () => window.removeEventListener("refreshData", refresh);
  }, []);

  // ================= LOAD CATEGORIES =================
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []));
  }, []);

  

  // ================= EVENT HANDLER =================
  useEffect(() => {
    const handler = async (e: any) => {
      const res = await fetch("/api/balance", { cache: "no-store" });
      const data = await res.json();
      setBalance(data.balance || 0);
    
      setShowModal(true);

      if (typeof e.detail === "string") {
        if (e.detail === "DEBT") {
          setAction("BORROW");
          setStep("FORM");
          setIsDirectFlow(true);
        } else if (e.detail === "RECEIVABLE") {
          setAction("GIVE");
          setStep("FORM");
          setIsDirectFlow(true);
        } else {
          setStep("ACTION");
          setIsDirectFlow(false);
        }
      }

      if (typeof e.detail === "object") {
        setStep("FORM");
        setEntity(e.detail.entity);

        if (e.detail.type === "DEBT_REPAID") setAction("REPAY");
        if (e.detail.type === "RECEIVABLE_RECEIVED") setAction("RECEIVE");
      }
    };

    window.addEventListener("openAdd", handler);
    return () => window.removeEventListener("openAdd", handler);
  }, []);

  // ================= TYPE MAP =================
  const actionToTypeMap: Record<string, string> = {
    INCOME: "INCOME",
    EXPENSE: "EXPENSE",
    BORROW: "DEBT_TAKEN",
    GIVE: "RECEIVABLE_GIVEN",
    REPAY: "DEBT_REPAID",
    RECEIVE: "RECEIVABLE_RECEIVED",
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    setError("");
  
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }
  
    if ((action === "INCOME" || action === "EXPENSE") && !category) {
      setError("Select a category");
      return;
    }
  
    if (
      ["BORROW", "GIVE", "REPAY", "RECEIVE"].includes(action) &&
      !entity
    ) {
      setError("Enter person / entity");
      return;
    }

    // ================= BALANCE CHECK =================
    const currentBalance = Number(balance); // make sure balance exists in state
    const amountNumber = Number(amount);
    
    // Block expense
    if (action === "EXPENSE" && amountNumber > currentBalance) {
      setError(`Not enough balance (You have ${currentBalance} Tk)`);
      return;
    }
    
    // Block receivable given (GIVE)
    if (action === "GIVE" && amountNumber > currentBalance) {
      setError(`You only have ${currentBalance} Tk`);
      return;
    }    
  
    const body: any = {
      type: actionToTypeMap[action],
      amount: Number(amount),
      account,
      date: new Date().toISOString(),
      note,
    };
  
    if (category) body.category_id = category;
    if (entity) body.entity = entity;
  
    const res = await fetch("/api/transactions", {
      method: "POST",
      body: JSON.stringify(body),
    });
  
    const data = await res.json();

    if (res.ok) {
      // RESET
      setShowModal(false);
      setStep("ACTION");
      setAmount("");
      setCategory("");
      setEntity("");
      setNote("");
      setError("");
      setIsDirectFlow(false);
      
      window.dispatchEvent(new Event("refreshData"));
    }
  

  };

  return (
    <div className="flex min-h-screen bg-white text-black dark:bg-slate-950 dark:text-white">
      
      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <aside className="hidden md:flex w-64 bg-gray-100 dark:bg-slate-900 p-5 flex-col gap-6">
        <div>
          <h1 className="text-green-500 text-xl font-bold">My Finance</h1>

          <button
            onClick={toggleTheme}
            className="mt-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 hover:scale-105 transition"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>

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

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-6 pb-28 md:pb-6">
        {children}
      </main>

      {/* ================= RIGHT PANEL ================= */}
      <aside className="hidden lg:block w-80 bg-gray-100 dark:bg-slate-900 p-5">
        <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Insights
        </h3>

        <div className="bg-gray-200 dark:bg-slate-800 p-4 rounded-xl">
          Coming soon...
        </div>
      </aside>

      {/* ================= FLOATING NAV (MOBILE) ================= */}
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

      {/* ================= MODAL ================= */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          onClick={() => {
            setShowModal(false);
            setIsDirectFlow(false);
            setStep("ACTION");
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[340px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-modalIn"
          >
            {/* ================= ACTION ================= */}
            {step === "ACTION" && (
              <>
                {/* HEADER */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Select Action
                  </h3>
      
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setIsDirectFlow(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                  >
                    ✕
                  </button>
                </div>
      
                {/* ACTION GRID */}
                <div className="grid grid-cols-2 gap-3">
                  <ActionCard label="Income" onClick={() => { setAction("INCOME"); setStep("FORM"); }} />
                  <ActionCard label="Expense" onClick={() => { setAction("EXPENSE"); setStep("FORM"); }} />
                  <ActionCard label="Borrow" onClick={() => { setAction("BORROW"); setStep("FORM"); }} />
                  <ActionCard label="Give" onClick={() => { setAction("GIVE"); setStep("FORM"); }} />
                </div>
      
                {/* CANCEL */}
                <button
                  onClick={() => {
                    setShowModal(false);
                    setIsDirectFlow(false);
                  }}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
                >
                  Cancel
                </button>
              </>
            )}
      
            {/* ================= FORM ================= */}
            {step === "FORM" && (
              <>
                {/* HEADER */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {action === "INCOME" && "Add Income"}
                    {action === "EXPENSE" && "Add Expense"}
                    {action === "BORROW" && "Borrow Money"}
                    {action === "GIVE" && "Give Money"}
                  </h3>
      
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setIsDirectFlow(false);
                      setStep("ACTION");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                  >
                    ✕
                  </button>
                </div>
      
                {/* INPUTS */}
                <input
                  className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
      
                <select
                  className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                >
                  <option>Cash</option>
                  <option>Bank</option>
                </select>
      
                {(action === "INCOME" || action === "EXPENSE") && (
                  <select
                    className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {categories
                      .filter((c) => c.type === action)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                )}
      
                {(action === "BORROW" || action === "GIVE") && (
                  <input
                    className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Person / Bank"
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                  />
                )}
      
                <input
                  className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Add note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
      
                {/* ERROR */}
                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}
      
                {/* SAVE */}
                <button
                  onClick={handleSubmit}
                  className="bg-green-500 hover:bg-green-600 active:scale-95 transition py-3 rounded-xl text-black font-semibold"
                >
                  Save
                </button>
      
                {/* BACK (ONLY MULTI STEP) */}
                {!isDirectFlow && (
                  <button
                    onClick={() => setStep("ACTION")}
                    className="bg-gray-200 dark:bg-slate-700 py-3 rounded-xl text-gray-800 dark:text-white"
                  >
                    Back
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )} 
    </div>
  );
}

// ================= COMPONENTS =================

function Item({ label, href, pathname }: any) {
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <div className={isActive ? "bg-green-500 text-black px-3 py-2 rounded" : "px-3 py-2"}>
        {label}
      </div>
    </Link>
  );
}

import {
  Home,
  ArrowLeftRight,
  CreditCard,
  Wallet,
  BarChart3,
  Tag,
} from "lucide-react";

function FloatingNav({ pathname }: { pathname: string }) {
  // ================= NAV ITEMS =================
  const items = [
    { label: "Home", href: "/", icon: Home },
    { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { label: "Categories", href: "/categories", icon: Tag },
    { label: "Debt", href: "/debts", icon: CreditCard },
    { label: "Receivable", href: "/receivables", icon: Wallet },
    { label: "Reports", href: "/reports", icon: BarChart3 },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full px-4">
      
      <div
        className="flex justify-around items-center w-full max-w-md mx-auto 
        px-2 py-2 rounded-full 
        bg-slate-900/80 backdrop-blur-xl 
        border border-slate-700 shadow-xl"
      >
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center justify-center gap-2 py-2 rounded-full transition-all duration-300 ${
                  active
                    ? "bg-green-500 text-black shadow-lg shadow-green-500/30 px-4 scale-105"
                    : "text-gray-400 hover:text-white hover:bg-slate-800 w-10 h-10"
                }`}
              >
                {/* ICON */}
                <Icon size={16} />

                {/* LABEL (ONLY ACTIVE) */}
                <span
                  className={`text-sm whitespace-nowrap transition-all duration-300 ${
                    active ? "block font-semibold ml-1" : "hidden"
                  }`}
                >
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

function ActionCard({ label, onClick }: any) {
  const styles: any = {
    Income: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/30",
    Expense: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/30",
    Borrow: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/30",
    Give: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/30",
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl text-center cursor-pointer transition active:scale-95 hover:scale-[1.03] ${styles[label]}`}
    >
      {label}
    </div>
  );
}
