"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "teal",
  suffix = "",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "teal" | "green" | "amber" | "blue";
  suffix?: string;
}) {
  return (
    <Card className="overflow-hidden transition-colors hover:border-primary/30">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-heading text-3xl font-semibold tabular-nums">
            {value.toLocaleString()}
            {suffix}
          </p>
        </div>
        <div
          className={cn(
            "grid size-12 place-items-center rounded-lg",
            tone === "teal" && "bg-teal/10 text-teal",
            tone === "green" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
            tone === "amber" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
            tone === "blue" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
