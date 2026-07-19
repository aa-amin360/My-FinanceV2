"use client";

import React from "react";
import { Target, TrendingUp } from "lucide-react";

type Goal = {
  id: number;
  name: string;
  target_amount: string;
  current_amount: string;
};

export default function SavingsMonoliths({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) return null;

  return (
    <div className="bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md rounded-[32px] p-6 shadow-sm flex flex-col h-full min-h-[320px]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 flex items-center gap-2">
            <Target size={14} className="text-indigo-500" /> Goal Monoliths
          </h3>
        </div>
        <TrendingUp size={16} className="text-indigo-500/50" />
      </div>

      {/* The Monolith Grid */}
      <div className="flex-1 flex items-end justify-around gap-4 pb-2 px-2">
        {goals.slice(0, 5).map((goal, idx) => {
          const current = Number(goal.current_amount);
          const target = Number(goal.target_amount);
          const progress = Math.min((current / target) * 100, 100);

          return (
            <div key={goal.id} className="flex flex-col items-center gap-4 w-full group">
              <div className="relative w-full max-w-[40px] aspect-[1/4] sm:aspect-[1/5]">
                {/* Background Pillar (Glass) */}
                <div className="absolute inset-0 bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full overflow-hidden">
                  {/* Liquid Fill */}
                  <div 
                    className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-indigo-400 transition-all duration-[1500ms] ease-out shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                    style={{ 
                      height: `${progress}%`,
                      transitionDelay: `${idx * 150}ms`
                    }}
                  >
                    {/* Liquid Top Wave Effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/20 blur-[1px]" />
                  </div>
                </div>

                {/* Floating Percentage (Only shows on hover or high progress) */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 -top-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1"
                >
                  <span className="text-[10px] font-black text-indigo-500 whitespace-nowrap bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {progress.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Label */}
              <div className="text-center space-y-0.5 max-w-full">
                <p className="text-[10px] font-bold text-black dark:text-white truncate uppercase tracking-tighter opacity-80">
                  {goal.name}
                </p>
                <p className="text-[8px] font-medium text-slate-500 dark:text-zinc-500">
                  {Math.round(current/1000)}k
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}