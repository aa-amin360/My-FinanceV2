"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Percent } from "lucide-react";
import DashboardLayout from "@/frontend/components/templates/DashboardLayout";
import MetricCard from "@/frontend/components/molecules/MetricCard";
import PageHeader from "@/frontend/components/molecules/PageHeader";
import SegmentedControl from "@/frontend/components/molecules/SegmentedControl";
import BalanceHistoryCard from "@/frontend/components/organisms/BalanceHistoryCard";
import ExpenseBreakdownCard from "@/frontend/components/organisms/ExpenseBreakdownCard";
import { reportsApi } from "@/frontend/api/reports";
import { localDateString } from "@/shared/config";
import type { Report, ReportRange } from "@/shared/apiTypes";

const RANGE_OPTIONS: { value: ReportRange; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "YEAR", label: "This Year" },
  { value: "MONTH", label: "This Month" },
];

const EMPTY_REPORT: Report = { range: "MONTH", income: 0, expense: 0, categories: [], trajectory: [] };

export default function ReportsScreen() {
  const [report, setReport] = useState<Report>(EMPTY_REPORT);
  const [range, setRange] = useState<ReportRange>("MONTH");

  // Totals, category breakdown and balance history for the selected period
  useEffect(() => {
    reportsApi
      .get(range, localDateString())
      .then(setReport)
      .catch((err) => console.error("Failed to load reports:", err));
  }, [range]);

  const { income, expense } = report;
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 animate-fadeIn pb-16">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <PageHeader title="Reports" subtitle="Analyze your historical performance and savings efficiency." />

          <div className="flex gap-2 items-center self-end sm:self-center">
            <SegmentedControl options={RANGE_OPTIONS} value={range} onChange={setRange} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard title="Total Income" value={income} type="income" icon={ArrowUpRight} />
          <MetricCard title="Total Expense" value={expense} type="expense" icon={ArrowDownRight} />
          <MetricCard title="Net Savings Rate" value={savingsRate} type="savings" icon={Percent} isPercentage={true} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <BalanceHistoryCard trajectory={report.trajectory} />
          <ExpenseBreakdownCard categories={report.categories} totalExpense={expense} />
        </div>
      </div>
    </DashboardLayout>
  );
}
