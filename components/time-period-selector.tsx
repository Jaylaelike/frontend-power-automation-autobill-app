"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TimePeriod } from "@/lib/types/station";

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  className?: string;
}

const periods: { value: TimePeriod; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

export function TimePeriodSelector({
  selectedPeriod,
  onPeriodChange,
  className,
}: TimePeriodSelectorProps) {
  return (
    <div className={cn("flex space-x-1 rounded-lg bg-muted p-1", className)}>
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={selectedPeriod === period.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onPeriodChange(period.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-all",
            selectedPeriod === period.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}