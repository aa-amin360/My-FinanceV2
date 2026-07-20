"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

type MetricCardProps = {
  title: string;
  value: number;
  type: "income" | "expense" | "debt" | "receivable" | "savings";
  href?: string;
  icon?: LucideIcon;
  isPercentage?: boolean;
};

export default function MetricCard({
  title,
  value,
  type,
  href,
  icon: Icon,
  isPercentage = false,
}: MetricCardProps) {
  // Restore the exact deep-saturated, premium glassmorphic colors you loved
  const getThemeStyles = () => {
    switch (type) {
      case "income":
        return {
          text: "text-green-700 dark:text-green-400",
          bg: "bg-green-500/20 dark:bg-green-950/35",
          border: "border-green-500/35 dark:border-green-500/25",
        };
      case "expense":
        return {
          text: "text-red-700 dark:text-red-400",
          bg: "bg-red-500/20 dark:bg-red-950/35",
          border: "border-red-500/35 dark:border-red-500/25",
        };
      case "debt":
        return {
          text: "text-cyan-700 dark:text-cyan-400",
          bg: "bg-cyan-500/20 dark:bg-cyan-950/35",
          border: "border-cyan-500/35 dark:border-cyan-500/25",
        };
      case "receivable":
        return {
          text: "text-yellow-700 dark:text-yellow-400",
          bg: "bg-yellow-500/20 dark:bg-yellow-950/35",
          border: "border-yellow-500/35 dark:border-yellow-500/25",
        };
      case "savings":
      default:
        return {
          text: "text-indigo-700 dark:text-indigo-400",
          bg: "bg-indigo-500/20 dark:bg-[#12192a]/35",
          border: "border-indigo-500/35 dark:border-indigo-500/25",
        };
    }
  };

  const { text, bg, border } = getThemeStyles();
  const formattedValue = isPercentage 
    ? value.toFixed(1) 
    : Number(value).toLocaleString("en-BD");

  const cardBody = (
    <div className={`p-4 sm:p-5 rounded-3xl border transition hover:scale-[1.01] duration-200 backdrop-blur-md flex justify-between items-center w-full ${bg} ${border}`}>
      <div className="min-w-0 flex-1 pr-2">
        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider block leading-none opacity-85 ${text}`}>
          {title}
        </span>
        <div className="mt-2.5 flex items-baseline gap-1">
          <span className={`font-black leading-none truncate text-base sm:text-lg lg:text-xl tracking-tight ${text}`}>
            {formattedValue}
          </span>
          <span className={`text-[10px] shrink-0 font-bold opacity-80 ${text}`}>
            {isPercentage ? "%" : "Tk"}
          </span>
        </div>
      </div>
      {Icon && (
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-transparent ${bg}`}>
          <Icon size={16} className={text} />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full">
        {cardBody}
      </Link>
    );
  }

  return cardBody;
}