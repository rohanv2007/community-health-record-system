"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type DashboardChartsProps = {
  appointmentDays: Array<{ day: string; appointments: number }>;
  ageBuckets: Array<{ name: string; value: number }>;
};

export type RevenueChartProps = {
  revenue: Array<{ day: string; revenue: number }>;
};

const chartColors = ["#0D9488", "#2563EB", "#16A34A", "#D97706"];
const axisStyle = { fontSize: 12, fill: "rgb(var(--muted-foreground))" };

export const DashboardCharts = memo(function DashboardCharts({
  appointmentDays,
  ageBuckets,
}: DashboardChartsProps) {
  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Appointments per day</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={appointmentDays}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border))" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={axisStyle} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisStyle} />
              <ChartTooltip cursor={{ fill: "rgb(var(--muted))" }} />
              <Bar dataKey="appointments" radius={[5, 5, 0, 0]} fill="#0D9488" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Patient age distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ageBuckets}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={3}
              >
                {ageBuckets.map((bucket, index) => (
                  <Cell key={bucket.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Legend />
              <ChartTooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
});

export const RevenueChart = memo(function RevenueChart({ revenue }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue trend</CardTitle>
      </CardHeader>
      <CardContent className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenue}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border))" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={axisStyle} />
            <YAxis tickLine={false} axisLine={false} tick={axisStyle} />
            <ChartTooltip cursor={{ fill: "rgb(var(--muted))" }} />
            <Bar dataKey="revenue" fill="#0D9488" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
