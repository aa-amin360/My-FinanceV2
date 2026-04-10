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

  // ================= FORM STATE =================
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("Cash");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  // ================= LOAD CATEGORIES =================
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []));
  }, []);

  // ================= EVENT LISTENER =================
  useEffect(() => {
    const handler = (e: any) => {
      setShowModal(true);

      if (typeof e.detail === "string") {
        if (e.detail === "DEBT") {
          setAction("BORROW");
          setStep("FORM");
        } else if (e.detail === "RECEIVABLE") {
          setAction("GIVE");
          setStep("FORM");
        } else {
          setStep("ACTION");
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

    // REFRESH ALL PAGES
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
            className="mt-4 w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700"
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full text-2xl flex items-center justify-center"
      >
        +
      </button>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[340px] bg-white dark:bg-slate-900 rounded-2xl p-5 flex flex-col gap-4 animate-modalIn">

            {/* ACTION */}
            {step === "ACTION" && (
              <>
                <h3 className="text-center font-semibold">Select Action</h3>

                <div className="grid grid-cols-2 gap-3">
                  <ActionCard label="Income" onClick={() => { setAction("INCOME"); setStep("FORM"); }} />
                  <ActionCard label="Expense" onClick={() => { setAction("EXPENSE"); setStep("FORM"); }} />
                  <ActionCard label="Borrow" onClick={() => { setAction("BORROW"); setStep("FORM"); }} />
                  <ActionCard label="Give" onClick={() => { setAction("GIVE"); setStep("FORM"); }} />
                </div>

                <button onClick={() => setShowModal(false)}>Cancel</button>
              </>
            )}

            {/* FORM */}
            {step === "FORM" && (
              <>
                <h3 className="font-semibold">{action}</h3>

                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="p-3 rounded bg-gray-100 dark:bg-slate-800"
                  placeholder="Amount"
                />

                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="p-3 rounded bg-gray-100 dark:bg-slate-800"
                >
                  <option>Cash</option>
                  <option>Bank</option>
                </select>

                {(action === "INCOME" || action === "EXPENSE") && (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="p-3 rounded bg-gray-100 dark:bg-slate-800"
                  >
                    <option>Select Category</option>
                    {categories
                      .filter((c) => c.type === action)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                )}

                {(action !== "INCOME" && action !== "EXPENSE") && (
                  <input
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                    className="p-3 rounded bg-gray-100 dark:bg-slate-800"
                    placeholder="Person / Bank"
                  />
                )}

                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="p-3 rounded bg-gray-100 dark:bg-slate-800"
                  placeholder="Note"
                />

                <button onClick={handleSubmit} className="bg-green-500 py-3 rounded">
                  Save
                </button>

                <button onClick={() => setStep("ACTION")}>Back</button>
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
      <div className={`p-2 rounded ${isActive ? "bg-green-500" : ""}`}>
        {label}
      </div>
    </Link>
  );
}

function ActionCard({ label, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="p-4 bg-gray-200 dark:bg-slate-800 rounded-xl text-center cursor-pointer"
    >
      {label}
    </div>
  );
}
