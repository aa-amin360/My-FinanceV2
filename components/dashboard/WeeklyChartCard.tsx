"use client";

import { useEffect, useState } from "react";

type DayData = {
  day: string;
  amount: number;
};

export default function WeeklyChartCard() {
  const [data, setData] = useState<DayData[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadWeeklyData = async () => {
      try {
        const res = await fetch("/api/dashboard/weekly-expenses");
        const json = await res.json();

        setData(json.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    loadWeeklyData();
  }, []);

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">

      {/* HEADER */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-black dark:text-white">
            ${total.toLocaleString()}
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Weekly Expenses
          </p>
        </div>

        <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition">
          Week
        </button>
      </div>

      {/* CHART */}
      <div className="flex items-end justify-between h-44 gap-2 relative">

        {data.map((item, index) => {
          const height = (item.amount / maxAmount) * 100;

          const isActive =
            activeIndex === index ||
            (activeIndex === null && index === data.length - 1);

          return (
            <div
              key={item.day}
              className="flex flex-col items-center flex-1"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {/* VALUE */}
              {isActive && (
                <div className="mb-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-xs text-black dark:text-white whitespace-nowrap">
                  ${item.amount.toLocaleString()}
                </div>
              )}

              {/* BAR */}
              <div
                className={`w-full rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-black dark:bg-white"
                    : "bg-gray-200 dark:bg-slate-700"
                }`}
                style={{
                  height: `${Math.max(height, 18)}%`,
                }}
              />

              {/* LABEL */}
              <span className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
