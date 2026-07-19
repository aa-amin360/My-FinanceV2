"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Option = {
  value: string | number;
  label: string;
};

type DropdownProps = {
  label?: string;
  options: Option[];
  selectedValue: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function Dropdown({
  label,
  options,
  selectedValue,
  onChange,
  placeholder = "Select Option",
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the dropdown list if clicked outside the component
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <div className="relative flex flex-col gap-1 w-full text-left" ref={containerRef}>
      {label && (
        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
          {label}
        </span>
      )}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white text-sm flex justify-between items-center transition-all ${
          disabled ? "opacity-55 cursor-not-allowed" : "cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
        }`}
      >
        <span className="font-semibold text-slate-700 dark:text-zinc-300">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1.5 p-1 bg-white/95 dark:bg-black/95 border border-black/[0.05] dark:border-white/[0.05] rounded-2xl shadow-xl z-50 flex flex-col animate-modalIn max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className="px-4 py-2.5 text-left text-xs font-bold rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition text-slate-700 dark:text-zinc-300"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}