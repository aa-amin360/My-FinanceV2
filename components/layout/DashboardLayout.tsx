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

  // ================= EVENT =================
  useEffect(() => {
    const handler = (e: any) => {
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

  // ================= MAPPING =================
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
      
    // ================= VALIDATION =================
  
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }
  
    if ((action === "INCOME" || action === "EXPENSE") && !category) {
      setError("Select a category");
      return;
    }
  
    if (
      (action === "BORROW" ||
        action === "GIVE" ||
        action === "REPAY" ||
        action === "RECEIVE") &&
      !entity
    ) {
      setError("Enter person / entity");
      return;
    }
      
    // ================= API =================
  
    const type = actionToTypeMap[action];
  
    const body: any = {
      type,
      amount: Number(amount),
      account,
      date: new Date().toISOString(),
      note,
    };
  
    if (category) body.category_id = category;
    if (entity) body.entity = entity;
  
    await fetch("/api/transactions", {
      method: "POST",
      body: JSON.stringify(body),
    });
  
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
  };

  return (
    <div className="flex min-h-screen bg-white text-black dark:bg-slate-950 dark:text-white">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-100 dark:bg-slate-900 p-5 hidden md:flex flex-col gap-6">
        <div>
          <h1 className="text-green-500 text-xl font-bold">My Finance</h1>

          <button
            onClick={toggleTheme}
            className="mt-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 hover:scale-105 transition-all"
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

      {/* FLOATING BUTTON */}
      <button
        onClick={() => {
          if (pathname === "/debts") {
            window.dispatchEvent(new CustomEvent("openAdd", { detail: "DEBT" }));
          } else if (pathname === "/receivables") {
            window.dispatchEvent(new CustomEvent("openAdd", { detail: "RECEIVABLE" }));
          } else {
            window.dispatchEvent(new CustomEvent("openAdd", { detail: "GENERAL" }));
          }
        }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 text-black text-2xl flex items-center justify-center shadow-lg hover:scale-105 transition"
      >
        +
      </button>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="w-[340px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-modalIn">

            {/* ACTION */}
            {step === "ACTION" && (
              <>
                <h3 className="text-center text-lg font-semibold tracking-wide text-gray-800 dark:text-gray-200 mb-2">
                  Select Action
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <ActionCard label="Income" onClick={() => { setAction("INCOME"); setStep("FORM"); }} />
                  <ActionCard label="Expense" onClick={() => { setAction("EXPENSE"); setStep("FORM"); }} />
                  <ActionCard label="Borrow" onClick={() => { setAction("BORROW"); setStep("FORM"); }} />
                  <ActionCard label="Give" onClick={() => { setAction("GIVE"); setStep("FORM"); }} />
                </div>

                <button
                  onClick={() => {
                    setShowModal(false);
                    setIsDirectFlow(false);
                  }}
                  className="mt-3 text-sm text-gray-500 dark:text-gray-400"
                >
                  Cancel
                </button>
              </>
            )}

            {/* FORM */}
            {step === "FORM" && (
              <>
                <h3 className="font-semibold text-gray-800 dark:text-white">
                  {action}
                </h3>

                <input
                  className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Amount"
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

                {(action !== "INCOME" && action !== "EXPENSE") && (
                  <input
                    className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Person / Bank"
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                  />
                )}

                <input
                  className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                <button onClick={handleSubmit} className="bg-green-500 hover:bg-green-600 active:scale-95 transition py-3 rounded-xl">
                  Save
                </button>

                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                {!isDirectFlow && (
                  <button
                    onClick={() => setStep("ACTION")}
                    className="bg-gray-200 dark:bg-slate-700 py-3 rounded-xl"
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
