"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useRefresh } from "@/hooks/useRefresh";

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
        <div className="max-w-4xl mx-auto px-1 sm:px-4">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-black dark:text-white">
              <span className="text-green-500">📅</span> {monthName}
            </h1>

            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-800 transition active:scale-95 text-black dark:text-white"
              >
                <ChevronLeft size={14} className="sm:w-4 sm:h-4" /> Prev
              </button>

              <button
                onClick={handleNextMonth}
                className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-800 transition active:scale-95 text-black dark:text-white"
              >
                Next <ChevronRight size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day} className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 py-1">
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
                    className="aspect-square bg-gray-50/20 dark:bg-zinc-950/10 rounded-xl sm:rounded-2xl border border-transparent"
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
                    aspect-square p-1 sm:p-2 rounded-xl sm:rounded-2xl cursor-pointer transition flex flex-col justify-between
                    bg-white dark:bg-zinc-950/40
                    border border-gray-200 dark:border-zinc-900/80
                    shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.03)]
                    hover:border-green-500 dark:hover:border-green-500/80
                    hover:bg-gray-50 dark:hover:bg-zinc-900/30
                    hover:scale-[1.02]
                    active:scale-95
                  "
                >
                  {/* Day Number */}
                  <span className="text-lg sm:text-sm font-bold text-gray-700 dark:text-zinc-300 self-end">
                    {day}
                  </span>

                  {/* Daily Income/Expense Glimpse */}
                  <div className="flex flex-col gap-0.5 mt-auto text-left w-full overflow-hidden">
                    {income > 0 && (
                      <div className="text-green-600 dark:text-green-400 font-semibold truncate leading-tight">
                        {/* Mobile Compact View */}
                        <span className="md:hidden text-[7.5px] tracking-tighter block">
                          +{formatCompact(income)}
                        </span>
                        {/* Desktop Full View */}
                        <span className="hidden md:block text-xs">
                          +{income.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {expense > 0 && (
                      <div className="text-red-500 dark:text-red-400 font-semibold truncate leading-tight">
                        {/* Mobile Compact View */}
                        <span className="md:hidden text-[7.5px] tracking-tighter block">
                          -{formatCompact(expense)}
                        </span>
                        {/* Desktop Full View */}
                        <span className="hidden md:block text-[10px]">
                          -{expense.toLocaleString()}
                        </span>
                      </div>
                    )}
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
        <div className="max-w-2xl mx-auto px-2 sm:px-4">
          {/* Header Controls */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => setSelectedDateStr(null)}
              className="
                p-2 rounded-xl
                bg-gray-100 dark:bg-zinc-900
                border border-gray-200 dark:border-zinc-800
                hover:bg-gray-200 dark:hover:bg-zinc-800
                transition active:scale-95
              "
            >
              <ArrowLeft size={18} className="text-black dark:text-white" />
            </button>

            <h1 className="text-lg sm:text-2xl font-bold text-black dark:text-white">
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
                    bg-white dark:bg-zinc-950
                    border border-gray-200 dark:border-zinc-900
                    rounded-2xl
                    px-4 sm:px-5 py-3.5 sm:py-4
                    flex justify-between items-center
                    hover:bg-gray-50 dark:hover:bg-zinc-900/50
                    transition-all duration-200
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

                  <div className="text-right shrink-0">
                    <div className={`font-bold text-sm sm:text-base ${isPositive ? "text-green-500" : "text-red-500"}`}>
                      {isPositive ? "+" : "-"}
                      {amount.toLocaleString("en-BD")} Tk
                    </div>

                    <div className="mt-1">
                      <span
                        className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-medium ${
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
