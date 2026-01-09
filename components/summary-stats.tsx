"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Activity, Gauge } from "lucide-react";
import type { PowerReading } from "@/lib/types/station";

interface SummaryStatsProps {
  latestReading: PowerReading | null;
  isLoading: boolean;
}

function calculateTotalPower(reading: PowerReading | null, type: 'active' | 'mux'): number {
  if (!reading) return 0;

  if (type === 'active') {
    return (
      (reading.activePower1 || 0) +
      (reading.activePower2 || 0) +
      (reading.activePower3 || 0) +
      (reading.activePower4 || 0) +
      (reading.activePower5 || 0) +
      (reading.activePower6 || 0)
    );
  } else {
    return (
      (reading.muxPower1 || 0) +
      (reading.muxPower2 || 0) +
      (reading.muxPower3 || 0) +
      (reading.muxPower4 || 0) +
      (reading.muxPower5 || 0) +
      (reading.muxPower6 || 0)
    );
  }
}

function countActiveSensors(reading: PowerReading | null, type: 'active' | 'mux'): number {
  if (!reading) return 0;

  if (type === 'active') {
    return [
      reading.activePower1,
      reading.activePower2,
      reading.activePower3,
      reading.activePower4,
      reading.activePower5,
      reading.activePower6,
    ].filter(value => value !== null && value !== undefined).length;
  } else {
    return [
      reading.muxPower1,
      reading.muxPower2,
      reading.muxPower3,
      reading.muxPower4,
      reading.muxPower5,
      reading.muxPower6,
    ].filter(value => value !== null && value !== undefined).length;
  }
}

export function SummaryStats({ latestReading, isLoading }: SummaryStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalActivePower = calculateTotalPower(latestReading, 'active');
  const totalMuxPower = calculateTotalPower(latestReading, 'mux');
  const activeSensors = countActiveSensors(latestReading, 'active');
  const activeMuxMeters = countActiveSensors(latestReading, 'mux');
  const totalSensors = activeSensors + activeMuxMeters;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Active Power */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Active Power</CardTitle>
          <Zap className="h-4 w-4 text-chart-1" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-1">
            {totalActivePower.toFixed(2)} W
          </div>
          <p className="text-xs text-muted-foreground">
            {activeSensors} active sensor{activeSensors !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Total MUX Power */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total MUX Power</CardTitle>
          <Activity className="h-4 w-4 text-chart-2" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-2">
            {totalMuxPower.toFixed(2)} kWh
          </div>
          <p className="text-xs text-muted-foreground">
            {activeMuxMeters} active meter{activeMuxMeters !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Total Sensors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sensors</CardTitle>
          <Gauge className="h-4 w-4 text-chart-3" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-3">
            {totalSensors}
          </div>
          <p className="text-xs text-muted-foreground">
            {latestReading ? 'sensors reporting' : 'no data available'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}