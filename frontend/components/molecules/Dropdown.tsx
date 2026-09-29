"use client";

import React, { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useClickOutside } from "@/frontend/hooks/useClickOutside";
import FieldLabel from "@/frontend/components/atoms/FieldLabel";
import Presence from "@/frontend/components/atoms/Presence";

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

  // Close when clicking outside
  useClickOutside(containerRef, () => setIsOpen(false));

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <div className="relative flex flex-col gap-1 w-full text-left" ref={containerRef}>
      {label && (
        <FieldLabel as="span" inset>
          {label}
        </FieldLabel>
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
        <ChevronDown size={14} className={`text-slate-400 dark:text-zinc-500 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      <Presence show={isOpen} exitMs={140}>
        <div className="absolute top-full left-0 w-full mt-1.5 p-1 bg-white/95 dark:bg-black/95 border border-black/[0.05] dark:border-white/[0.05] rounded-2xl shadow-xl z-50 flex flex-col animate-popIn max-h-48 overflow-y-auto">
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
      </Presence>
    </div>
  );
}