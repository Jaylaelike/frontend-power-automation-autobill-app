"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RealtimeDataPoint } from "@/lib/types/station";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface WeeklyBarChartProps {
  data: RealtimeDataPoint[];
  isLoading?: boolean;
  error?: string | null;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  onRefresh?: () => void;
}

export function WeeklyBarChart({
  data,
  isLoading = false,
  error = null,
  autoRefresh = true,
  refreshInterval = 5000, // 5 seconds
  onRefresh,
}: WeeklyBarChartProps) {
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  // Auto-refresh functionality
  React.useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(() => {
      onRefresh();
      setLastUpdate(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Prepare data for ApexCharts
  const chartData = React.useMemo(() => {
    const timestamps = data.map(point => formatTime(point.timestamp));
    const activePowerData = data.map(point => Math.round(point.totalActivePower));
    const muxPowerData = data.map(point => Math.round(point.totalMuxPower));

    return {
      categories: timestamps,
      series: [
        {
          name: 'Total Active Power (W)',
          data: activePowerData,
          color: '#3b82f6', // Blue
        },
        {
          name: 'Total MUX Power (W)',
          data: muxPowerData,
          color: '#10b981', // Green
        }
      ]
    };
  }, [data]);

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      height: 400,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        }
      },
      background: 'transparent',
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    colors: ['#3b82f6', '#10b981'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 4,
        dataLabels: {
          position: 'top',
        }
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
      categories: chartData.categories,
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px',
        }
      },
      title: {
        text: 'Time',
        style: {
          fontSize: '12px',
        }
      }
    },
    yaxis: {
      title: {
        text: 'Power (W)',
        style: {
          fontSize: '12px',
        }
      },
      labels: {
        formatter: (value) => `${Math.round(value)}W`,
        style: {
          fontSize: '12px',
        }
      }
    },
    fill: {
      opacity: 0.9,
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.3,
        gradientToColors: ['#60a5fa', '#34d399'],
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
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '14px',
      markers: {
        size: 6,
      }
    },
    grid: {
      borderColor: 'hsl(var(--border))',
      strokeDashArray: 3,
    },
    theme: {
      mode: 'light', // Will be handled by CSS variables
    }
  };

  if (error) {
    return (
      <Card className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Weekly Power Data</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Error loading weekly data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Weekly Power Data</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Live power readings - Last updated: {lastUpdate.toLocaleTimeString()}
          {autoRefresh && " (Auto-refresh every 5s)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && data.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="w-full h-[400px]">
            <Chart
              options={chartOptions}
              series={chartData.series}
              type="bar"
              height={400}
              width="100%"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}