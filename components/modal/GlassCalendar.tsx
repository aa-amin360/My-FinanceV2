"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (date: string) => void;
  placeholder: string;
};

export default function GlassCalendar({ value, onChange, placeholder }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDay }, (_, i) => null);

  const handleDateSelect = (day: number) => {
    const selected = new Date(year, month, day);
    const offset = selected.getTimezoneOffset();
    const corrected = new Date(selected.getTime() - offset * 60 * 1000);
    onChange(corrected.toISOString().split("T")[0]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* ✅ RESPONSIVE TRIGGER BUTTON */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center gap-2 sm:gap-3 
          px-3 sm:px-4 py-2.5 
          rounded-xl sm:rounded-2xl 
          bg-black/[0.03] dark:bg-white/[0.03] 
          border border-black/[0.05] dark:border-white/[0.05] 
          backdrop-blur-md cursor-pointer 
          hover:bg-white/60 dark:hover:bg-black/45 
          transition-all min-h-[40px] sm:min-h-[46px]
        "
      >
        <CalendarIcon size={14} className="text-slate-400 shrink-0" />
        
        <span className={`text-xs sm:text-sm whitespace-nowrap flex-1 ${value ? "text-black dark:text-white font-medium" : "text-slate-400"}`}>
          {value 
            ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) 
            : placeholder
          }
        </span>

        {value && (
          <X 
            size={14} 
            className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-black/5" 
            onClick={(e) => { e.stopPropagation(); onChange(""); }} 
          />
        )}
      </div>

      {/* ✅ RESPONSIVE DROPDOWN POPUP */}
      {isOpen && (
        <div className="
          absolute top-full mt-2 
          left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0
          w-[280px] sm:w-[300px] 
          bg-white/95 dark:bg-[#0d1318]/95 
          backdrop-blur-xl border border-black/10 dark:border-white/10 
          rounded-3xl shadow-2xl z-[120] p-4 sm:p-5 
          animate-modalIn
        ">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button 
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <h4 className="text-sm font-bold text-black dark:text-white">
              {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h4>
            <button 
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Week Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <span key={d} className="text-[10px] font-black text-slate-400 uppercase text-center tracking-tighter">{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {[...padding, ...days].map((day, i) => (
              <div key={i} className="aspect-square flex items-center justify-center">
                {day && (
                  <button
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`
                      w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold transition-all
                      ${value === `${year}-${(month+1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-110"
                        : "text-slate-600 dark:text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-500"}
                    `}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}