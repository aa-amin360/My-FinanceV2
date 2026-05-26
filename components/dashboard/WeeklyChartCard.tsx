"use client";

import { useEffect, useState } from "react";
import { useRefresh } from "@/hooks/useRefresh";

type DayData = {
  day: string;
  amount: number;
};

export default function WeeklyChartCard() {
  const [data, setData] = useState<DayData[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const loadWeeklyData = async () => {
    try {
      const res = await fetch("/api/dashboard/weekly-expenses");
      const json = await res.json();
  
      setData(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };
  
  useRefresh(loadWeeklyData);

  // 🔥 FIX: use absolute values
  const maxAmount = Math.max(
    ...data.map((d) => Math.abs(d.amount)),
    1
  );

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-white dark:bg-black rounded-3xl p-6 border border-gray-200 dark:border-zinc-900 shadow-sm">
    
      {/* HEADER */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-4xl font-bold text-black dark:text-white">
            {total.toLocaleString()} Tk
          </h2>
    
          <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
            Weekly Flow
          </p>
        </div>
    
        <button className="text-sm text-gray-500 dark:text-zinc-500">
          Week
        </button>
      </div>
    
      {/* CHART */}
      <div className="h-52 flex items-end justify-between gap-3">
    
        {data.map((item, index) => {
          const normalized =
            (Math.abs(item.amount) / maxAmount) * 100;
    
          const today = new Date().toLocaleDateString("en-US", {
            weekday: "short",
          });
    
          const isActive =
            activeIndex === index ||
            (activeIndex === null && item.day === today);
    
          return (
            <div
              key={item.day}
              className="flex-1 flex flex-col items-center justify-end h-full relative"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
    
              {/* PILL */}
              {isActive && (
                <div
                  className="
                  absolute top-0
                  px-3 py-1
                  rounded-full
                  bg-black dark:bg-white
                  text-white dark:text-black
                  text-xs font-medium
                  whitespace-nowrap
                  shadow-md z-10
                  "
                >
                  {Math.abs(item.amount).toLocaleString()} Tk
                </div>
              )}
    
              {/* BAR AREA */}
              <div className="flex items-end h-40 w-full">
    
                <div
                  className={`w-full rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-black dark:bg-white"
                      : "bg-gray-200 dark:bg-zinc-800"
                  }`}
                  style={{
                    height: `${Math.max(normalized, 12)}%`,
                  }}
                />
              </div>
    
              {/* LABEL */}
              <span className="mt-3 text-xs text-gray-500 dark:text-zinc-500">
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
