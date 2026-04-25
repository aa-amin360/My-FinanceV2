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
    <div className="p-4 rounded-2xl">
      <ResponsiveContainer width="100%" height={250}>
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
              color: "#ffffff",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
