"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, RefreshCw } from "lucide-react";
import { PowerReadingsTable } from "./power-readings-table";
import { StatsCards } from "./stats-cards";
import { ThemeToggle } from "./theme-toggle";

export function MeterReadingDashboard() {
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["power-readings"],
    queryFn: async () => {
      const response = await fetch("/api/power-readings");
      if (!response.ok) throw new Error("Failed to fetch power readings");
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });

  const lastUpdate = new Date(dataUpdatedAt).toLocaleTimeString();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 lg:p-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">
              Meter Reading Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time power monitoring across all stations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="gap-2 border-primary/20 bg-primary/5 text-primary"
          >
            <Activity className="h-3 w-3 animate-pulse" />
            Live
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            <span>Last update: {lastUpdate}</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards data={data} isLoading={isLoading} />

      {/* Main Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl">Station Power Readings</CardTitle>
          <CardDescription>
            Detailed view of all MUX and Active Power readings from monitoring
            stations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PowerReadingsTable data={data} isLoading={isLoading} error={error} />
        </CardContent>
      </Card>
    </div>
  );
}
