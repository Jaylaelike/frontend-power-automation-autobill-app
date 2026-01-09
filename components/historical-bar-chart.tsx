"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AggregatedDataPoint, DateRange, TimePeriod } from "@/lib/types/station";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface HistoricalBarChartProps {
  data: AggregatedDataPoint[];
  dateRange: DateRange;
  timePeriod: TimePeriod;
  isLoading?: boolean;
  error?: string | null;
}

export function HistoricalBarChart({
  data,
  dateRange,
  timePeriod,
  isLoading = false,
  error = null,
}: HistoricalBarChartProps) {
  const formatPeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'day': return 'Daily';
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      case 'year': return 'Yearly';
      default: return 'Historical';
    }
  };

  const formatDateRange = () => {
    const fromStr = dateRange.from.toLocaleDateString();
    const toStr = dateRange.to.toLocaleDateString();
    return `${fromStr} - ${toStr}`;
  };

  // Prepare data for ApexCharts
  const chartData = React.useMemo(() => {
    const categories = data.map(item => item.label);
    const activePowerData = data.map(item => Math.round(item.activePowerSum));
    const muxPowerData = data.map(item => Math.round(item.muxPowerSum));

    return {
      categories,
      series: [
        {
          name: 'Active Power (W)',
          data: activePowerData,
          color: '#3b82f6', // Blue
        },
        {
          name: 'MUX Power (W)',
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
          <CardTitle className="text-lg font-semibold">Historical Power Data</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Error loading chart data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
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
          <CardTitle className="text-lg font-semibold">Historical Power Data</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{formatPeriodLabel(timePeriod)} Power Data</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Aggregated power readings for {formatDateRange()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[400px]">
          <Chart
            options={chartOptions}
            series={chartData.series}
            type="bar"
            height={400}
            width="100%"
          />
        </div>
      </CardContent>
    </Card>
  );
}