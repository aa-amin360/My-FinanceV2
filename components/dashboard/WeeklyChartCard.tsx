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

  const maxAmount = Math.max(
    ...data.map((d) => Math.abs(d.amount)),
    1
  );

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    // ✅ Updated card to standard translucent glassmorphism with subtle light/dark borders
    <div className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md rounded-3xl p-6 shadow-sm shadow-black/[0.01] flex-1 flex flex-col justify-between">
    
      {/* HEADER */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            {total.toLocaleString()} Tk
          </h2>
    
          <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 mt-1">
            Weekly Flow
          </p>
        </div>
    
        <button className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
          Week
        </button>
      </div>
    
      {/* CHART */}
      <div className="h-44 flex items-end justify-between gap-3">
    
        {data.map((item, index) => {
          const normalized = (Math.abs(item.amount) / maxAmount) * 100;
    
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
    
              {/* ✅ Updated active floating pill to a cohesive glassmorphic style */}
              {isActive && (
                <div
                  className="
                  absolute top-0
                  px-2.5 py-1
                  rounded-xl
                  bg-white/95 dark:bg-black/95
                  border border-black/[0.05] dark:border-white/[0.05]
                  text-black dark:text-white
                  text-[10px] font-bold
                  whitespace-nowrap
                  shadow-md z-10 animate-modalIn
                  "
                >
                  {Math.abs(item.amount).toLocaleString()} Tk
                </div>
              )}
    
                {/* BAR AREA */}
                  <div className="flex items-end h-40 w-full">
        
                    <div
                      className={`w-8 sm:w-12 mx-auto rounded-full transition-all duration-300 ${
                        isActive
                          ? "bg-green-500 dark:bg-green-500" 
                          : "bg-black/[0.08] dark:bg-white/[0.08]" 
                      }`}
                      style={{
                        height: `${Math.max(normalized, 12)}%`,
                      }}
                    />
                  </div>
    
              {/* LABEL */}
              <span className="mt-3 text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-zinc-500">
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}