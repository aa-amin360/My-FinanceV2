"use client";

import { useTheme } from "../ThemeProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  ArrowLeftRight,
  CreditCard,
  Wallet,
  BarChart3,
  Tag,
} from "lucide-react";

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
    <>
      <div className="flex min-h-screen bg-white text-black dark:bg-slate-950 dark:text-white">

        {/* ================= SIDEBAR ================= */}
        <aside className="hidden md:flex w-64 bg-gray-100 dark:bg-slate-900 p-5 flex-col gap-6">
          <div>
            <h1 className="text-green-500 text-xl font-bold">My Finance</h1>

            <button
              onClick={toggleTheme}
              className="mt-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700"
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

        {/* ================= FLOATING NAV ================= */}
        <FloatingNav pathname={pathname} />

        {/* ================= FAB ================= */}
        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent("openAdd", { detail: "GENERAL" }))
          }
          className="fixed bottom-28 md:bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 text-black text-2xl flex items-center justify-center shadow-lg z-50"
        >
          +
        </button>

        {/* ================= MAIN MODAL ================= */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
            <div className="w-[340px] bg-slate-900 rounded-xl p-5 flex flex-col gap-4">

              {step === "ACTION" && (
                <>
                  <h3 className="text-center text-white">Select Action</h3>

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
                  <input
                    className="p-3 rounded bg-slate-800"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />

                  <button
                    onClick={handleSubmit}
                    className="bg-green-500 py-2 rounded"
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}






// ================= FLOATING NAV =================

function FloatingNav({ pathname }: { pathname: string }) {
  const [showMore, setShowMore] = useState(false);

  const items = [
    { label: "Home", href: "/", icon: Home },
    { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { label: "Categories", href: "/categories", icon: Tag },
    { label: "More", action: "MORE", icon: BarChart3 },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full px-4">
        <div className="flex justify-between max-w-md mx-auto px-2 py-2 rounded-full bg-slate-900/80 border border-slate-700">

          {items.map((item) => {
            const Icon = item.icon;

            if (item.action === "MORE") {
              return (
                <div
                  key={item.label}
                  onClick={() => setShowMore(true)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-400 cursor-pointer"
                >
                  <Icon size={16} />
                  <span>More</span>
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    pathname === item.href
                      ? "bg-green-500 text-black"
                      : "text-gray-400"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* MORE MODAL */}
      {showMore && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-slate-900 p-5 rounded-t-xl">

            <Link href="/debts" onClick={() => setShowMore(false)}>
              <div className="p-3">Debt</div>
            </Link>

            <Link href="/receivables" onClick={() => setShowMore(false)}>
              <div className="p-3">Receivable</div>
            </Link>

            <Link href="/reports" onClick={() => setShowMore(false)}>
              <div className="p-3">Reports</div>
            </Link>

            <button onClick={() => setShowMore(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}






function Item({ label, href, pathname }: any) {
  return (
    <Link href={href}>
      <div className={pathname === href ? "bg-green-500 px-3 py-2 rounded" : "px-3 py-2"}>
        {label}
      </div>
    </Link>
  );
}

function ActionCard({ label, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="p-4 bg-slate-800 rounded text-center cursor-pointer"
    >
      {label}
    </div>
  );
}
