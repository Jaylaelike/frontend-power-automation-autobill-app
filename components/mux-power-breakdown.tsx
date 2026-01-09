"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RealtimeDataPoint } from "@/lib/types/station";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MuxPowerBreakdownProps {
  data: RealtimeDataPoint[];
  isLoading?: boolean;
  error?: string | null;
}

// Color palette for each MUX channel
const MUX_COLORS = [
  { primary: '#3b82f6', gradient: '#60a5fa', bg: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900', text: 'text-blue-700 dark:text-blue-300' },
  { primary: '#10b981', gradient: '#34d399', bg: 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900', text: 'text-green-700 dark:text-green-300' },
  { primary: '#f59e0b', gradient: '#fbbf24', bg: 'from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900', text: 'text-amber-700 dark:text-amber-300' },
  { primary: '#ef4444', gradient: '#f87171', bg: 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900', text: 'text-red-700 dark:text-red-300' },
  { primary: '#8b5cf6', gradient: '#a78bfa', bg: 'from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900', text: 'text-violet-700 dark:text-violet-300' },
  { primary: '#ec4899', gradient: '#f472b6', bg: 'from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900', text: 'text-pink-700 dark:text-pink-300' },
];

export function MuxPowerBreakdown({
  data,
  isLoading = false,
  error = null,
}: MuxPowerBreakdownProps) {
  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Prepare data for each MUX channel
  const muxChannelData = React.useMemo(() => {
    const channels = [];
    
    for (let i = 1; i <= 6; i++) {
      const channelKey = `muxPower${i}` as keyof RealtimeDataPoint;
      const timestamps = data.map(point => formatTime(point.timestamp));
      const values = data.map(point => {
        const val = point[channelKey] as number | null;
        return val !== null ? Math.round(val) : 0;
      });
      
      // Calculate stats from realtime data
      const validValues = values.filter(v => v !== 0);
      const latestValue = values[values.length - 1] || 0;
      
      channels.push({
        index: i,
        name: `MUX Power ${i}`,
        timestamps,
        values,
        latestValue,
        hasData: validValues.length > 0,
        color: MUX_COLORS[i - 1],
      });
    }
    
    return channels;
  }, [data]);

  const formatPowerValue = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}kW`;
    }
    return `${value}W`;
  };

  const createChartOptions = (channel: typeof muxChannelData[0]): ApexCharts.ApexOptions => ({
    chart: {
      type: 'bar',
      height: 180,
      sparkline: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
      background: 'transparent',
    },
    colors: [channel.color.primary],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '70%',
        borderRadius: 3,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 1,
      colors: ['transparent']
    },
    xaxis: {
      categories: channel.timestamps,
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      }
    },
    yaxis: {
      labels: {
        show: false,
      }
    },
    fill: {
      opacity: 0.9,
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.3,
        gradientToColors: [channel.color.gradient],
        inverseColors: false,
        opacityFrom: 0.9,
        opacityTo: 0.6,
        stops: [0, 100]
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val) => `${val} W`
      }
    },
    grid: {
      show: false,
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }
    },
  });

  if (error) {
    return (
      <Card className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">MUX Power Breakdown</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">MUX Power Breakdown</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Loading channel data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[240px] bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">MUX Power Breakdown</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Individual power readings for each MUX channel (1-6)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {muxChannelData.map((channel) => (
            <Card 
              key={channel.index} 
              className={`shadow-sm border-0 bg-linear-to-br ${channel.color.bg}`}
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm font-medium ${channel.color.text}`}>
                    {channel.name}
                  </CardTitle>
                  <div className="text-right">
                    <div 
                      className="text-lg font-bold"
                      style={{ color: channel.color.primary }}
                    >
                      {channel.latestValue} W
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(channel.latestValue / 1000).toFixed(2)} kW
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {/* Chart Section */}
                {channel.hasData ? (
                  <div className="h-[180px]">
                    <Chart
                      options={createChartOptions(channel)}
                      series={[{ name: channel.name, data: channel.values }]}
                      type="bar"
                      height={180}
                      width="100%"
                    />
                  </div>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                    No realtime data
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
