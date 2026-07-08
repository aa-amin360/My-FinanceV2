"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useRefresh } from "@/hooks/useRefresh";
import { useRouter } from "next/navigation";

type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
  note: string | null;
  category_name?: string;
  entity_name?: string;
  parent_id?: string | null;
};

export default function CalendarPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // =========================
  // LOAD TRANSACTIONS
  // =========================
  const loadTransactions = async () => {
    try {
      const res = await fetch("/api/transactions", { cache: "no-store" });
      const json = await res.json();
      setTransactions(json.data || []);
    } catch (err) {
      console.error("Failed to load calendar transactions:", err);
    }
  };

  useRefresh(loadTransactions);

  // =========================
  // CALENDAR CALCULATION HELPERS
  // =========================
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const paddingCells = Array.from({ length: firstDayIndex }, (_, i) => null);
  const dayCells = Array.from({ length: totalDays }, (_, i) => i + 1);
  const gridCells = [...paddingCells, ...dayCells];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getFormattedDateString = (day: number) => {
    const yStr = year.toString();
    const mStr = (month + 1).toString().padStart(2, "0");
    const dStr = day.toString().padStart(2, "0");
    return `${yStr}-${mStr}-${dStr}`;
  };

  // =========================
  // COMPACT NUMBER FORMATTER
  // =========================
  const formatCompact = (num: number) => {
    if (num >= 100000) {
      return (num / 1000).toFixed(0) + "K";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  };

  // =========================
  // DAILY TRANSACTION AGGREGATOR
  // =========================
  const getDailyTotals = (day: number) => {
    const dateStr = getFormattedDateString(day);

    const dayTxs = transactions.filter((t) => {
      const txDatePrefix = t.date.substring(0, 10);
      return txDatePrefix === dateStr && !t.parent_id;
    });

    let income = 0;
    let expense = 0;

    dayTxs.forEach((t) => {
      const amt = Number(t.amount);
      if (t.type === "INCOME") {
        income += amt;
      } else if (t.type === "EXPENSE") {
        expense += amt;
      }
    });

    return { income, expense, count: dayTxs.length };
  };

  const getSelectedDayTransactions = () => {
    if (!selectedDateStr) return [];
    return transactions.filter((t) => {
      const txDatePrefix = t.date.substring(0, 10);
      return txDatePrefix === selectedDateStr && !t.parent_id;
    });
  };

  const formatName = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getDisplayName = (t: Transaction) => {
    if (t.entity_name) return formatName(t.entity_name);
    if (t.category_name) return formatName(t.category_name);
    return t.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const selectedTxs = getSelectedDayTransactions();

  return (
    <DashboardLayout>
      {/* ==============================================
          1. MONTH VIEW (CALENDAR GRID)
          ============================================== */}
      {!selectedDateStr ? (
        <div className="w-full px-1 sm:px-4 space-y-6 animate-fadeIn">
        {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard")} // ✅ Returns users to dashboard
                className="
                  p-2 rounded-xl
                  bg-black/[0.03] dark:bg-white/[0.03]
                  border border-black/[0.04] dark:border-white/[0.04]
                  hover:bg-black/[0.06] dark:hover:bg-white/[0.06]
                  transition active:scale-95 shrink-0
                "
                aria-label="Back to dashboard"
              >
                <ArrowLeft size={18} className="text-black dark:text-white" />
              </button>

              <h1 className="text-2xl font-bold flex items-center gap-2 text-black dark:text-white tracking-tight">
                <Calendar size={22} className="text-emerald-500" /> {monthName}
              </h1>
            </div>

            <div className="flex gap-2 self-end sm:self-center">
              <button
                onClick={handlePrevMonth}
                className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] text-slate-700 dark:text-zinc-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition active:scale-95"
              >
                <ChevronLeft size={14} /> Prev
              </button>

              <button
                onClick={handleNextMonth}
                className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] text-slate-700 dark:text-zinc-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition active:scale-95"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day} className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {gridCells.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="aspect-square bg-black/[0.01] dark:bg-white/[0.01] border border-transparent rounded-xl sm:rounded-2xl"
                  />
                );
              }

              const { income, expense } = getDailyTotals(day);
              const dateKey = getFormattedDateString(day);

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDateStr(dateKey)}
                  className="
                    aspect-square p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl cursor-pointer transition flex flex-col justify-between
                    bg-white/45 dark:bg-black/35
                    border border-black/[0.05] dark:border-white/[0.04]
                    backdrop-blur-md shadow-sm shadow-black/[0.01]
                    shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)]
                    hover:border-emerald-500 dark:hover:border-emerald-500/80
                    hover:bg-white/60 dark:hover:bg-black/45
                    hover:scale-[1.02]
                    active:scale-95
                  "
                >
                  {/* Day Number */}
                  <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-zinc-300 self-end leading-none">
                    {day}
                  </span>

                  {/* Fixed-Height Metric Container (prevents cells from stretching) */}
                  <div className="h-6 sm:h-8 flex flex-col justify-end text-left w-full overflow-hidden mt-auto">
                    {/* Income Slot */}
                    <div className="h-3 sm:h-4 flex items-center">
                      {income > 0 ? (
                        <div className="text-emerald-600 dark:text-emerald-400 font-bold truncate leading-none w-full">
                          <span className="md:hidden text-[7.5px] tracking-tighter block leading-none">
                            +{formatCompact(income)}
                          </span>
                          <span className="hidden md:block text-[10px] leading-none">
                            +{income.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>

                    {/* Expense Slot */}
                    <div className="h-3 sm:h-4 flex items-center">
                      {expense > 0 ? (
                        <div className="text-rose-500 dark:text-rose-400 font-bold truncate leading-none w-full">
                          <span className="md:hidden text-[7.5px] tracking-tighter block leading-none">
                            -{formatCompact(expense)}
                          </span>
                          <span className="hidden md:block text-[10px] leading-none">
                            -{expense.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ==============================================
            2. DAILY DETAIL VIEW
            ============================================== */
        <div className="w-full px-2 sm:px-4 space-y-6 animate-fadeIn pb-16">
          {/* Header Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDateStr(null)}
              className="
                p-2 rounded-xl
                bg-black/[0.03] dark:bg-white/[0.03]
                border border-black/[0.04] dark:border-white/[0.04]
                hover:bg-black/[0.06] dark:hover:bg-white/[0.06]
                transition active:scale-95
              "
            >
              <ArrowLeft size={18} className="text-black dark:text-white" />
            </button>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black dark:text-white">
              {new Date(selectedDateStr + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h1>
          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {selectedTxs.map((t) => {
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

              return (
                <div
                  key={t.id}
                  className="
                    bg-white/25 dark:bg-zinc-950/10
                    border border-black/[0.03] dark:border-white/[0.03]
                    backdrop-blur-sm
                    rounded-2xl
                    px-4 sm:px-5 py-3.5 sm:py-4
                    flex justify-between items-center
                    hover:bg-white/35 dark:hover:bg-zinc-950/20
                    transition-all duration-200 shadow-sm
                  "
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="font-semibold text-sm sm:text-base text-black dark:text-white truncate">
                      {getDisplayName(t)}
                    </div>

                    <div className="text-[11px] sm:text-xs text-gray-500 dark:text-zinc-500 mt-1 truncate">
                      {t.note || "No note added"}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-4">
                    <div className="text-right">
                      <div className={`font-bold text-sm sm:text-base ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                        {isPositive ? "+" : "-"}
                        {amount.toLocaleString("en-BD")} Tk
                      </div>

                      <div className="mt-1">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            t.type === "INCOME"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : t.type === "EXPENSE"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : t.type.includes("DEBT")
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                              : t.type.includes("RECEIVABLE")
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {formatType(t.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {selectedTxs.length === 0 && (
              <div className="text-center text-gray-400 dark:text-zinc-500 py-16 text-sm">
                Transactions for this day will appear here.
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}