"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CashflowChart from "@/components/charts/CashflowChart";
import WeeklyChartCard from "@/components/dashboard/WeeklyChartCard";
import Link from "next/link";
import { Trash2, Wallet, Landmark } from "lucide-react";
import { useRefresh } from "@/hooks/useRefresh";
import { useRouter } from "next/navigation";

type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
  note: string | null;
  parent_id?: string | null;
  has_child?: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);
  const [debt, setDebt] = useState(0);
  const [receivable, setReceivable] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  //Intercept and redirect first-time users to onboarding if not yet initialized
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const res = await fetch("/api/auth/onboarding");
        const json = await res.json();
        if (json.success && json.history_initialized === false) {
          router.push("/onboarding");
        }
      } catch (err) {
        console.error("Onboarding check failed:", err);
      }
    };
    checkOnboardingStatus();
  }, [router]);

  // ================= LOAD DATA =================
  const loadData = async () => {
    try {
      // Fire all requests at the exact same time
      const [txRes, bRes, dRes, rRes] = await Promise.all([
        fetch("/api/transactions", { cache: "no-store" }),
        fetch("/api/balance", { cache: "no-store" }),
        fetch("/api/debts", { cache: "no-store" }),
        fetch("/api/receivables", { cache: "no-store" }),
      ]);

      // Parse all JSON responses in parallel
      const [txData, bData, dData, rData] = await Promise.all([
        txRes.json(),
        bRes.json(),
        dRes.json(),
        rRes.json(),
      ]);

      // Set state all at once
      setTransactions(txData.data || []);
      setBalance(Number(bData.balance || 0));
      setCashBalance(Number(bData.cashBalance || 0));
      setBankBalance(Number(bData.bankBalance || 0));
      setDebt(Number(dData.total || 0));
      setReceivable(Number(rData.total || 0));
    } catch (err) {
      console.error("Failed to load dashboard data in parallel:", err);
    }
  };

  useRefresh(loadData);

  // ================= CALCULATIONS =================
  let income = 0;
  let expense = 0;

  transactions.forEach((t) => {
    const amt = Number(t.amount);
  
    if (t.type === "INCOME") {
      income += amt;
    }
  
    if (t.type === "EXPENSE") {
      expense += amt;
    }
  });

  let runningBalance = 0;
  
  // Filter out parents with children to prevent double-counting, leaving only active nodes
  const parentIdsWithChildren = new Set(
    transactions.map((t) => t.parent_id).filter(Boolean)
  );

  const activeTransactions = transactions.filter(
    (t) => t.parent_id || !parentIdsWithChildren.has(t.id)
  );

  const chartData = activeTransactions
    .sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    )
    .map((t) => {
      const isPositive =
        t.type === "INCOME" ||
        t.type === "DEBT_TAKEN" ||
        t.type === "RECEIVABLE_RECEIVED";
  
      const amount = Number(t.amount);
  
      runningBalance = isPositive
        ? runningBalance + amount
        : runningBalance - amount;
  
      return {
        date: new Date(t.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
        balance: runningBalance,
      };
    });
  
  const handleDelete = async (id: string) => {
    await fetch(`/api/transactions/${id}`, {
      method: "DELETE",
    });
  
    window.dispatchEvent(new Event("refreshData"));
  };

  return (
    <DashboardLayout>
      {/* 🔥 OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-lg z-40"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* BALANCE */}
      <div className="relative z-50">
      
        {/* MAIN CARD */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 rounded-2xl text-black cursor-pointer flex justify-between items-center"
        >
          <h1
            className={`font-bold ${
              balance > 1000000
                ? "text-2xl"
                : balance > 100000
                ? "text-3xl"
                : "text-4xl"
            }`}
          >
            {Number(balance).toLocaleString("en-BD")} Tk
          </h1>
      
          {/* dropdown arrow */}
          <div
            className={`
              w-9 h-9 flex items-center justify-center
              rounded-full border border-black/20 dark:border-white/20
              bg-white/20 dark:bg-black/20
              shadow-sm hover:shadow-md
              transition-all duration-200
              ${open ? "rotate-180" : ""}
            `}
          >
            <span className="text-sm">▼</span>
          </div>
        </div>
      
        {/* DROPDOWN */}
        {open && (
          <div className="absolute top-full left-0 w-full mt-2 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-gray-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden z-50">
      
            <div className="px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer">
              <Wallet size={16} />
              Cash Balance — {Number(cashBalance).toLocaleString("en-BD")} Tk
            </div>
            
            <div className="px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer">
              <Landmark size={16} />
              Bank Balance — {Number(bankBalance).toLocaleString("en-BD")} Tk
            </div>
      
          </div>
        )}
      </div>
      
      {/* CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card title="Income" value={income} type="income" />
      
        <Card title="Expenses" value={expense} type="expense" />
      
        <Link href="/debts" className="block">
          <Card title="Debt" value={debt} type="debt" />
        </Link>
      
        <Link href="/receivables" className="block">
          <Card title="Receivable" value={receivable} type="receivable" />
        </Link>
      </div>
      
      {/* CHART */}
      <div className="mt-6 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-900 rounded-2xl p-5">
        <h3 className="mb-4 text-sm text-zinc-500">
          Balance
        </h3>

        <div className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-900 rounded-xl p-2 h-[260px]">
          <CashflowChart data={chartData} />
        </div>
      </div>

      {/* WEEKLY CHART */}
      <div className="mt-6 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-900 rounded-2xl p-5">
        <WeeklyChartCard />
      </div>

      {/* HISTORY */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 text-black dark:text-white">
          Recent Transactions
        </h3>

        <div className="space-y-3">
          {[...transactions]
            .filter((t: any) => !t.parent_id)
            .sort(
              (a, b) =>
                new Date(b.date).getTime() -
                new Date(a.date).getTime()
            )
            .slice(0, 5)
            .map((t) => {
              const amount = Number(t.amount);

              const isPositive =
                t.type === "INCOME" ||
                t.type === "DEBT_TAKEN" ||
                t.type === "RECEIVABLE_RECEIVED";

              const formatType = (type: string) =>
                type
                  .toLowerCase()
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());

              const capitalize = (text: string) =>
                text
                  ? text.charAt(0).toUpperCase() +
                    text.slice(1)
                  : "";

              const getDisplayName = (t: any) => {
                if (t.entity_name)
                  return capitalize(t.entity_name);

                if (t.category_name)
                  return capitalize(t.category_name);

                return formatType(t.type);
              };

              return (
                <div
                  key={t.id}
                  className="
                    bg-white dark:bg-zinc-950
                    border border-gray-200 dark:border-zinc-900
                    rounded-2xl
                    px-4 py-4
                    flex justify-between items-center
                    hover:bg-gray-50 dark:hover:bg-zinc-900
                    transition-all duration-200
                  "
                >
                  {/* LEFT */}
                  <div>
                    <div className="font-medium text-black dark:text-white">
                      {getDisplayName(t)}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                      {new Date(t.date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "UTC",
                        }
                      )}
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="flex items-center gap-4">

                    {/* AMOUNT + TYPE */}
                    <div className="text-right">
                      <div
                        className={`font-semibold ${
                          isPositive
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {isPositive ? "+" : "-"}
                        {Number(amount).toLocaleString(
                          "en-BD"
                        )}{" "}
                        Tk
                      </div>

                      <div className="mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            t.type === "INCOME"
                              ? "bg-green-500/10 text-green-400"
                              : t.type === "EXPENSE"
                              ? "bg-red-500/10 text-red-400"
                              : t.type.includes("DEBT")
                              ? "bg-blue-500/10 text-blue-400"
                              : t.type.includes("RECEIVABLE")
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {formatType(t.type)}
                        </span>
                      </div>
                    </div>

                    {/* DELETE */}
                    <button
                      onClick={() => setDeleteId(t.id)}
                      className="
                        p-2 rounded-full
                        hover:bg-red-500/10
                        text-red-400
                        hover:text-red-300
                        transition
                      "
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          
          <div className="bg-white/90 dark:bg-black/80 border border-gray-200 dark:border-slate-700 
            text-black dark:text-white backdrop-blur-xl rounded-2xl p-6 w-[320px] text-center shadow-2xl">
            
            <h3 className="text-lg font-semibold mb-4">
              Delete this transaction?
            </h3>
      
            <div className="flex gap-3 justify-center">
              
              <button
                onClick={async () => {
                  await handleDelete(deleteId);
                  setDeleteId(null);
                }}
                className="px-5 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
              >
                Delete
              </button>
      
              <button
                onClick={() => setDeleteId(null)}
                className="px-5 py-2 rounded-full bg-gray-200 dark:bg-slate-700 text-black dark:text-gray-300 hover:bg-slate-600 transition"
              >
                Cancel
              </button>
      
            </div>
      
          </div>
      
        </div>
      )}
    </DashboardLayout>
  );
}

// ================= COMPONENT =================

const getCardStyle = (type: string) => {
  switch (type) {
    case "income":
      return {
        text: "text-green-500",
        bg: "bg-green-500/20",
      };
    case "expense":
      return {
        text: "text-red-500",
        bg: "bg-red-500/20",
      };
    case "debt":
      return {
        text: "text-cyan-400",
        bg: "bg-cyan-400/20",
      };
    case "receivable":
      return {
        text: "text-yellow-400",
        bg: "bg-yellow-400/20",
      };
    default:
      return {
        text: "text-gray-400",
        bg: "bg-gray-100 dark:bg-black",
      };
  }
};

function Card({ title, value, type }: any) {
  const formatted = Number(value).toLocaleString("en-BD");
  const { text, bg } = getCardStyle(type);

  return (
    <div className={`${bg} p-4 sm:p-5 rounded-2xl min-w-0`}>
      <p className={`text-xs sm:text-sm font-medium tracking-wider uppercase ${text} opacity-90`}>
        {title}
      </p>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-bold leading-none truncate text-[clamp(16px,5vw,22px)]">
          {formatted}
        </span>
        <span className="text-[12px] text-gray-400 shrink-0">
          Tk
        </span>
      </div>
    </div>
  );
}
