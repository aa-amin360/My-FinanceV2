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

  // ================= EVENT HANDLER =================
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

    const body: any = {
      type: actionToTypeMap[action],
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
        className="fixed bottom-24 md:bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 text-black text-2xl flex items-center justify-center shadow-lg hover:scale-105 transition z-50"
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
            {step === "ACTION" && (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Select Action</h3>
                  <button onClick={() => setShowModal(false)}>✕</button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <ActionCard label="Income" onClick={() => { setAction("INCOME"); setStep("FORM"); }} />
                  <ActionCard label="Expense" onClick={() => { setAction("EXPENSE"); setStep("FORM"); }} />
                  <ActionCard label="Borrow" onClick={() => { setAction("BORROW"); setStep("FORM"); }} />
                  <ActionCard label="Give" onClick={() => { setAction("GIVE"); setStep("FORM"); }} />
                </div>
              </>
            )}

            {step === "FORM" && (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{action}</h3>
                  <button onClick={() => setShowModal(false)}>✕</button>
                </div>

                <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />

                <button onClick={handleSubmit}>Save</button>
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

function FloatingNav({ pathname }: { pathname: string }) {
  const items = [
    { label: "Home", href: "/" },
    { label: "Tx", href: "/transactions" },
    { label: "Debt", href: "/debts" },
    { label: "Recv", href: "/receivables" },
    { label: "Reports", href: "/reports" },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex gap-2 px-3 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">

        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <div className={active ? "bg-green-500 px-3 py-1 rounded-full" : "px-3 py-1"}>
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ActionCard({ label, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="p-3 bg-gray-200 dark:bg-slate-800 rounded cursor-pointer text-center"
    >
      {label}
    </div>
  );
}
