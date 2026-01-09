"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Activity, Radio } from "lucide-react";
import type { RealtimeDataPoint, AggregatedDataPoint } from "@/lib/types/station";

interface PowerSummaryCardsProps {
  realtimeData?: RealtimeDataPoint[];
  historicalData?: AggregatedDataPoint[];
  isLoading?: boolean;
  error?: string | null;
}

export function PowerSummaryCards({
  realtimeData = [],
  historicalData = [],
  isLoading = false,
  error = null,
}: PowerSummaryCardsProps) {
  // Calculate totals from the latest realtime data
  const latestRealtimeData = realtimeData[realtimeData.length - 1];
  
  // Calculate totals from historical data (sum of all periods)
  const historicalTotals = React.useMemo(() => {
    if (!historicalData.length) return { activePower: 0, muxPower: 0 };
    
    return historicalData.reduce(
      (acc, point) => ({
        activePower: acc.activePower + point.activePowerSum,
        muxPower: acc.muxPower + point.muxPowerSum,
      }),
      { activePower: 0, muxPower: 0 }
    );
  }, [historicalData]);

  // Count active sensors from latest reading
  const activeSensorCount = React.useMemo(() => {
    if (!latestRealtimeData) return 0;
    
    let count = 0;
    for (let i = 1; i <= 6; i++) {
      const activePower = latestRealtimeData[`activePower${i}` as keyof RealtimeDataPoint] as number | null;
      const muxPower = latestRealtimeData[`muxPower${i}` as keyof RealtimeDataPoint] as number | null;
      
      if (activePower !== null || muxPower !== null) {
        count++;
      }
    }
    return count;
  }, [latestRealtimeData]);

  const formatPowerValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}MW`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}kW`;
    } else {
      return `${Math.round(value)}W`;
    }
  };

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-20 text-muted-foreground">
                <p className="text-sm">Error loading data</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Active Power Card */}
      <Card className="shadow-sm border-0 bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Total Active Power
          </CardTitle>
          <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {latestRealtimeData ? `${Math.round(latestRealtimeData.totalActivePower)} W` : "0 W"}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            {latestRealtimeData ? `${(latestRealtimeData.totalActivePower / 1000).toFixed(2)} kW` : "0.00 kW"}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Historical Total: {formatPowerValue(historicalTotals.activePower)}
          </p>
        </CardContent>
      </Card>

      {/* Total MUX Power Card */}
      <Card className="shadow-sm border-0 bg-linear-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
            Total MUX Power
          </CardTitle>
          <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {latestRealtimeData ? `${Math.round(latestRealtimeData.totalMuxPower)} W` : "0 W"}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300 mt-1">
            {latestRealtimeData ? `${(latestRealtimeData.totalMuxPower / 1000).toFixed(2)} kW` : "0.00 kW"}
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            Historical Total: {formatPowerValue(historicalTotals.muxPower)}
          </p>
        </CardContent>
      </Card>

      {/* Total Sensors Card */}
      <Card className="shadow-sm border-0 bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Active Sensors
          </CardTitle>
          <Radio className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {activeSensorCount}
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Out of 6 total sensors
          </p>
        </CardContent>
      </Card>
    </div>
  );
}