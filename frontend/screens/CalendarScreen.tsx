"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/frontend/components/templates/DashboardLayout";
import CalendarDayView from "@/frontend/components/organisms/CalendarDayView";
import CalendarMonthView from "@/frontend/components/organisms/CalendarMonthView";
import { useRefresh } from "@/frontend/hooks/useRefresh";
import { transactionsApi } from "@/frontend/api/transactions";
import { monthRange } from "@/frontend/lib/calendar";
import { sumMoney } from "@/shared/money";
import type { Transaction } from "@/shared/apiTypes";

export default function CalendarScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Every transaction in the visible month
  const loadTransactions = async () => {
    try {
      const page = await transactionsApi.list({ all: true, ...monthRange(year, month) });
      setTransactions(page.data);
    } catch (err) {
      console.error("Failed to load calendar transactions:", err);
    }
  };

  useRefresh(loadTransactions, { runOnMount: false });

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  // Top-level transactions on a given day
  const transactionsOn = (dateKey: string) =>
    transactions.filter((t) => t.date.substring(0, 10) === dateKey && !t.parent_id);

  const totalsFor = (dateKey: string) => {
    const dayTxs = transactionsOn(dateKey);
    return {
      income: sumMoney(dayTxs.filter((t) => t.type === "INCOME").map((t) => t.amount)),
      expense: sumMoney(dayTxs.filter((t) => t.type === "EXPENSE").map((t) => t.amount)),
    };
  };

  return (
    <DashboardLayout>
      {!selectedDateStr ? (
        <CalendarMonthView
          year={year}
          month={month}
          totalsFor={totalsFor}
          onBack={() => router.push("/dashboard")}
          onPrev={() => setCurrentDate(new Date(year, month - 1, 1))}
          onNext={() => setCurrentDate(new Date(year, month + 1, 1))}
          onSelectDay={setSelectedDateStr}
        />
      ) : (
        <CalendarDayView
          dateKey={selectedDateStr}
          transactions={transactionsOn(selectedDateStr)}
          onBack={() => setSelectedDateStr(null)}
        />
      )}
    </DashboardLayout>
  );
}
