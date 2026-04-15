"use client";

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
  return (
    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
      <h3 className="text-sm text-gray-400 mb-2">Balance</h3>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          
          {/* GRADIENT */}
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* AXIS */}
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />

          {/* TOOLTIP */}
          <Tooltip
            contentStyle={{
              background: "#020617",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => `${value.toFixed(2)} Tk`}
          />

          {/* AREA LINE */}
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#balanceGradient)"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
