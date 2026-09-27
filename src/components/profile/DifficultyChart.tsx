"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Small client chart: solved vs remaining published problems per difficulty
 * band (spec 19.9). Kept tiny — it is a summary, not a dashboard.
 */

export interface DifficultyDatum {
  band: string;
  solved: number;
  remaining: number;
}

export function DifficultyChart({ data }: { data: DifficultyDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.solved + d.remaining, 0);
  if (total === 0) {
    return (
      <p className="p-4 text-xs text-muted">
        No published problems to chart yet.
      </p>
    );
  }

  return (
    <div className="h-44 w-full" aria-label="Difficulty distribution chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid stroke="#2a3346" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="band"
            tick={{ fill: "#9aa3b5", fontSize: 11 }}
            axisLine={{ stroke: "#2a3346" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#9aa3b5", fontSize: 11 }}
            axisLine={{ stroke: "#2a3346" }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(245, 158, 11, 0.06)" }}
            contentStyle={{
              background: "#151923",
              border: "1px solid #2a3346",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#e8eaf0",
            }}
          />
          <Bar dataKey="solved" stackId="band" fill="#f59e0b" name="Solved" />
          <Bar
            dataKey="remaining"
            stackId="band"
            fill="#2a3346"
            name="Not solved"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
