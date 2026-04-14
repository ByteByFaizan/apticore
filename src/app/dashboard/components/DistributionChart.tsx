"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "#1C3F3A", // brand
  "#5BA08F", // accent
  "#10B981", // emerald
  "#8B5CF6", // violet
  "#F59E0B", // amber
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

interface DistributionChartProps {
  title: string;
  data: Record<string, number>;
  accentColor?: string;
}

export default function DistributionChart({
  title,
  data,
  accentColor,
}: DistributionChartProps) {
  const chartData = Object.entries(data).map(([key, val]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: Math.round(val * 100),
  }));

  return (
    <div className="bg-white rounded-2xl border border-edge p-3 sm:p-5 transition-all duration-300 hover:shadow-[0_6px_24px_rgba(28,63,58,0.06)]">
      <p className="text-[10px] text-ink-faint uppercase tracking-[0.15em] font-semibold mb-2 sm:mb-4">
        {title}
      </p>

      <div className="h-[160px] sm:h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
            barSize={20}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                fontSize: "12px",
                padding: "8px 12px",
              }}
              formatter={(value: number) => [`${value}%`, "Share"]}
              cursor={{ fill: "rgba(28,63,58,0.03)" }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1200}>
              {chartData.map((_, i) => (
                <Cell
                  key={i}
                  fill={accentColor || CHART_COLORS[i % CHART_COLORS.length]}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
