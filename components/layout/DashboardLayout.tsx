"use client";

import { useTheme } from "../ThemeProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Space_Grotesk } from "next/font/google";

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
  CircleDollarSign,
  Home,
} from "lucide-react";

export default function DashboardLayout({
  children,
  balance,
}: {
  children: React.ReactNode;
  balance?: number;
}) {
  const { toggleTheme, theme } = useTheme();
  const pathname = usePathname();
  const currentBalance = Number(balance || 0);

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  // ================= MODAL STATE =================
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"ACTION" | "FORM">("ACTION");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= FORM STATE =================
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("Cash");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  const [error, setError] = useState("");
  const [isDirectFlow, setIsDirectFlow] = useState(false);

  // ================= LOAD CATEGORIES =================
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []));
  }, []);

  

  // ================= EVENT HANDLER =================
  useEffect(() => {
    const handler = async (e: any) => {    
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
    if (loading) return;
  
    setError("");
  
    // VALIDATION FIRST
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
  
    const amountNumber = Number(amount);
  
    if (action === "EXPENSE" && amountNumber > currentBalance) {
      setError(`Not enough balance (You have ${currentBalance} Tk)`);
      return;
    }
  
    if (action === "GIVE" && amountNumber > currentBalance) {
      setError(`You only have ${currentBalance} Tk`);
      return;
    }
    
    setLoading(true);
  
    try {
      const body: any = {
        type: actionToTypeMap[action],
        amount: amountNumber,
        account,
        date: new Date().toISOString(),
        note,
      };
  
      if (category) body.category_id = category;
      if (entity) body.entity = entity;
  
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
  
      if (res.ok) {
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
  
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white text-black dark:bg-slate-950 dark:text-white transition-colors duration-300">
      
      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <aside
        className={`hidden md:flex ${
          collapsed ? "w-20" : "w-56"
        } h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex-col transition-all duration-300`}
      >
        
        {/* ================= TOP ================= */}
        <div className="p-4 flex items-center justify-between">
          
          {/* TITLE */}
          {!collapsed && (
            <h2 className="text-sm font-semibold text-gray-400 tracking-widest">
              MENU
            </h2>
          )}
      
          {/* COLLAPSE BUTTON */}
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
        
        {/* ================= NAV ================= */}
        <div
          className={`flex-1 overflow-y-auto ${collapsed ? "px-1" : "px-2"}`}
        >
          <nav className="flex flex-col items-stretch">
            <Item icon={LayoutDashboard} label="Dashboard" href="/" pathname={pathname} collapsed={collapsed} />
            <Item icon={ArrowLeftRight} label="Transactions" href="/transactions" pathname={pathname} collapsed={collapsed} />
            <Item icon={Tag} label="Categories" href="/categories" pathname={pathname} collapsed={collapsed} />
            <Item icon={Wallet} label="Savings" href="/savings" pathname={pathname} collapsed={collapsed} />
            <Item icon={CreditCard} label="Debt" href="/debts" pathname={pathname} collapsed={collapsed} />
            <Item icon={Wallet} label="Receivable" href="/receivables" pathname={pathname} collapsed={collapsed} />
            <Item icon={BarChart3} label="Reports" href="/reports" pathname={pathname} collapsed={collapsed} />
          </nav>
        </div>        
      </aside>

      {/* ================= RIGHT SIDE ================= */}
      <div className="flex flex-col flex-1 h-full">
      
        {/* ================= HEADER ================= */}
        <div className="h-16 shrink-0 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
          
          {/* LEFT: APP NAME */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center text-black font-bold">
              $
            </div>
            <h1 className="text-lg font-semibold text-green-500 tracking-wide">
              My Finance
            </h1>
          </div>
      
          {/* RIGHT: THEME TOGGLE */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 hover:scale-105 transition"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>
      
        {/* ================= MAIN ================= */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      
      </div>
      

      {/* ================= RIGHT PANEL ================= */}
      {/*
      <aside className="hidden lg:block w-80 bg-gray-100 dark:bg-slate-900 p-5">
        <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Insights
        </h3>

        <div className="bg-gray-200 dark:bg-slate-800 p-4 rounded-xl">
          Coming soon...
        </div>
      </aside>
      */}

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
            className="w-[340px] bg-white/90 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-700 text-black dark:text-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-modalIn"
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
                  className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
      
                <select
                  className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                >
                  <option>Cash</option>
                  <option>Bank</option>
                </select>
      
                {(action === "INCOME" || action === "EXPENSE") && (
                  <select
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Person / Bank"
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                  />
                )}
      
                <input
                  className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  disabled={loading}
                  className={`py-3 rounded-xl font-semibold transition ${
                    loading
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600 active:scale-95"
                  }`}
                >
                  {loading ? "Processing..." : "Save"}
                </button>
      
                {/* BACK (ONLY MULTI STEP) */}
                {!isDirectFlow && (
                  <button
                    onClick={() => setStep("ACTION")}
                    className="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-black dark:text-white py-3 rounded-xl text-gray-800 dark:text-white"
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
    

// ================= COMPONENTS ================= //
function Item({ label, href, pathname, icon: Icon, collapsed }: any) {
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <div
        className={`flex items-center ${
          collapsed ? "justify-center w-full" : "gap-3 px-3"
        } py-2 rounded-lg cursor-pointer transition-all duration-200 ${
          isActive
            ? "bg-green-500 text-black font-medium"
            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-black dark:hover:text-white"
        }`}
      >
        <Icon size={collapsed ? 22 : 18} />
        {!collapsed && <span>{label}</span>}
      </div>
    </Link>
  );
}

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
        className="flex justify-around items-center w-full max-w-md mx-auto px-2 py-2 
        rounded-full bg-white/80 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-700 
        backdrop-blur-xl shadow-xl"
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
                    : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-800 w-10 h-10"
                }`}
              >
                {/* ICON */}
                <Icon size={20} />

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
