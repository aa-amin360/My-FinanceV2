"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#eab308", "#a855f7"];

export default function CategoryDonut({ data, onSelect }: any) {
  return (
    <div className="w-full h-full p-2 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            onClick={(entry) => onSelect?.(entry.name)}
          >
            {data.map((_: any, index: number) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              background: "#020617",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{
              color: "#ffffff",
              fontWeight: 500,
            }}
            itemStyle={{
              color: "#22c55e",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
