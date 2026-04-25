"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type Props = {
  data: {
    date: string;
    balance: number;
  }[];
};

export default function CashflowChart({ data }: Props) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const axisColor = isDark ? "#94a3b8" : "#475569";

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          {/* GRADIENT */}
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="#22c55e"
                stopOpacity={isDark ? 0.4 : 0.25}
              />
              <stop
                offset="95%"
                stopColor="#22c55e"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          {/* AXIS */}
          <XAxis
            dataKey="date"
            stroke={axisColor}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />

          <YAxis
            stroke={axisColor}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />

          {/* TOOLTIP */}
          <Tooltip
            contentStyle={{
              background: isDark ? "#020617" : "#ffffff",
              border: isDark
                ? "1px solid #1e293b"
                : "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
              color: isDark ? "#ffffff" : "#000000",
            }}
            formatter={(value: number) => `${value.toFixed(2)} Tk`}
          />

          {/* AREA */}
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#balanceGradient)"
            style={{ overflow: "visible" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
