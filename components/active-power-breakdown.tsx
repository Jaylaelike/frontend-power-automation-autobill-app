"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, TrendingUp, Download, Calendar, LineChart } from "lucide-react";
import { exportActivePowerBreakdownToCSV, exportTimeSeriesActivePowerData } from "@/lib/station-csv-export";
import { subDays, subWeeks, subMonths, subYears, format } from "date-fns";
import type { ModbusConfig } from "@/lib/types/station";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartDataPoint {
  label: string;
  value: number;
}

interface ActivePowerChannelAnalytics {
  channel: number;
  day: { min: number; max: number; avg: number; count: number; chartData: ChartDataPoint[] };
  week: { min: number; max: number; avg: number; count: number; chartData: ChartDataPoint[] };
  month: { min: number; max: number; avg: number; count: number; chartData: ChartDataPoint[] };
  year: { min: number; max: number; avg: number; count: number; chartData: ChartDataPoint[] };
}

interface ActivePowerBreakdownProps {
  stationId: string;
  stationName?: string;
  modbusConfig?: ModbusConfig | null;
  isLoading?: boolean;
  error?: string | null;
}

// Color palette for each Active Power channel
const ACTIVE_POWER_COLORS = [
  { primary: '#0ea5e9', gradient: '#38bdf8', bg: 'from-sky-50 to-sky-100 dark:from-sky-950 dark:to-sky-900', text: 'text-sky-700 dark:text-sky-300' },
  { primary: '#14b8a6', gradient: '#2dd4bf', bg: 'from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900', text: 'text-teal-700 dark:text-teal-300' },
  { primary: '#f97316', gradient: '#fb923c', bg: 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900', text: 'text-orange-700 dark:text-orange-300' },
  { primary: '#e11d48', gradient: '#fb7185', bg: 'from-rose-50 to-rose-100 dark:from-rose-950 dark:to-rose-900', text: 'text-rose-700 dark:text-rose-300' },
  { primary: '#7c3aed', gradient: '#a78bfa', bg: 'from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900', text: 'text-purple-700 dark:text-purple-300' },
  { primary: '#06b6d4', gradient: '#22d3ee', bg: 'from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900', text: 'text-cyan-700 dark:text-cyan-300' },
];

type TimePeriodKey = 'day' | 'week' | 'month' | 'year';

// Get modbus channel name for display
function getModbusChannelName(index: number, modbusConfig?: ModbusConfig | null): string {
  if (!modbusConfig) return `Active Power ${index}`;
  
  const modbusKey = `modbus${index}` as keyof ModbusConfig;
  const channelName = modbusConfig[modbusKey];
  
  if (channelName) {
    return `Active ${index} - ${channelName}`;
  }
  return `Active Power ${index}`;
}

export function ActivePowerBreakdown({
  stationId,
  stationName,
  modbusConfig,
  isLoading = false,
  error = null,
}: ActivePowerBreakdownProps) {
  const [analytics, setAnalytics] = React.useState<ActivePowerChannelAnalytics[] | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(true);
  const [analyticsError, setAnalyticsError] = React.useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = React.useState<TimePeriodKey>('day');

  // Fetch analytics data
  React.useEffect(() => {
    async function fetchAnalytics() {
      if (!stationId) return;
      
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      
      try {
        const response = await fetch(`/api/station/${stationId}/active-power-analytics`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const data = await response.json();
        setAnalytics(data.channels);
      } catch (err) {
        setAnalyticsError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setAnalyticsLoading(false);
      }
    }

    fetchAnalytics();
  }, [stationId]);

  const handleExportCSV = () => {
    if (!analytics || !stationName) return;
    
    exportActivePowerBreakdownToCSV({
      stationName,
      stationId,
      analytics,
      selectedPeriod,
      modbusConfig,
    });
  };

  const handleExportTimeSeries = () => {
    if (!analytics || !stationName) return;
    
    exportTimeSeriesActivePowerData({
      stationName,
      stationId,
      analytics,
      selectedPeriod,
      modbusConfig,
    });
  };

  const formatPowerValue = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}kW`;
    }
    return `${value}W`;
  };

  const getAnalyticsForChannel = (channelIndex: number) => {
    if (!analytics) return null;
    return analytics.find(a => a.channel === channelIndex);
  };

  const getPeriodLabel = (period: TimePeriodKey) => {
    switch (period) {
      case 'day': return 'Last 24 Hours';
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      case 'year': return 'Last 12 Months';
    }
  };

  const getDateRange = (period: TimePeriodKey) => {
    const now = new Date();
    let fromDate: Date;
    
    switch (period) {
      case 'day':
        fromDate = subDays(now, 1);
        break;
      case 'week':
        fromDate = subWeeks(now, 1);
        break;
      case 'month':
        fromDate = subMonths(now, 1);
        break;
      case 'year':
        fromDate = subYears(now, 1);
        break;
    }
    
    return {
      from: format(fromDate, 'MMM dd, yyyy HH:mm'),
      to: format(now, 'MMM dd, yyyy HH:mm'),
    };
  };

  const createChartOptions = (color: typeof ACTIVE_POWER_COLORS[0], chartData: ChartDataPoint[]): ApexCharts.ApexOptions => ({
    chart: {
      type: 'bar',
      height: 120,
      sparkline: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
      background: 'transparent',
    },
    colors: [color.primary],
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
      categories: chartData.map(d => d.label),
      labels: {
        show: true,
        rotate: 0,
        style: {
          fontSize: '9px',
        }
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
        gradientToColors: [color.gradient],
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
        left: 5,
        right: 5,
        top: 0,
        bottom: 0,
      }
    },
  });

  if (error) {
    return (
      <Card className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Active Power Breakdown</CardTitle>
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

  if (isLoading || analyticsLoading) {
    return (
      <Card className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Active Power Breakdown</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Loading channel data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[320px] bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analyticsError) {
    return (
      <Card className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Active Power Breakdown</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Error loading analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <p>Error: {analyticsError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">Active Power Breakdown</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Historical power data for each Active Power channel (1-6)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={selectedPeriod} onValueChange={(v: string) => setSelectedPeriod(v as TimePeriodKey)}>
                <TabsList className="grid grid-cols-4 w-[280px]">
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                </TabsList>
              </Tabs>
              {analytics && stationName && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Full
                  </Button>
                  <Button
                    onClick={handleExportTimeSeries}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <LineChart className="h-4 w-4" />
                    Time Series
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Date Range Display */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border/50">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">{getPeriodLabel(selectedPeriod)}:</span>
              <span className="text-muted-foreground">
                {getDateRange(selectedPeriod).from} → {getDateRange(selectedPeriod).to}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((channelIndex) => {
            const channelAnalytics = getAnalyticsForChannel(channelIndex);
            const periodStats = channelAnalytics?.[selectedPeriod];
            const color = ACTIVE_POWER_COLORS[channelIndex - 1];
            const chartData = periodStats?.chartData || [];
            const channelName = getModbusChannelName(channelIndex, modbusConfig);
            
            return (
              <Card 
                key={channelIndex} 
                className={`shadow-sm border-0 bg-linear-to-br ${color.bg}`}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-sm font-medium ${color.text}`}>
                      {channelName}
                    </CardTitle>
                    <div className="text-right">
                      <div 
                        className="text-lg font-bold"
                        style={{ color: color.primary }}
                      >
                        {periodStats?.avg || 0} W
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {((periodStats?.avg || 0) / 1000).toFixed(2)} kW
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {/* Analytics Section */}
                  <div className="mb-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      {getPeriodLabel(selectedPeriod)} Analytics
                    </div>
                    {periodStats ? (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <ArrowDown className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-muted-foreground">MIN</span>
                          </div>
                          <div className="text-sm font-semibold" style={{ color: color.primary }}>
                            {formatPowerValue(periodStats.min)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-muted-foreground">AVG</span>
                          </div>
                          <div className="text-sm font-semibold" style={{ color: color.primary }}>
                            {formatPowerValue(periodStats.avg)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <ArrowUp className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-muted-foreground">MAX</span>
                          </div>
                          <div className="text-sm font-semibold" style={{ color: color.primary }}>
                            {formatPowerValue(periodStats.max)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground text-center">No data</div>
                    )}
                    {periodStats && periodStats.count > 0 && (
                      <div className="text-xs text-muted-foreground text-center mt-2">
                        Based on {periodStats.count} readings
                      </div>
                    )}
                  </div>

                  {/* Chart Section - Historical Data */}
                  {chartData.length > 0 ? (
                    <div className="h-[120px]">
                      <Chart
                        options={createChartOptions(color, chartData)}
                        series={[{ name: channelName, data: chartData.map(d => d.value) }]}
                        type="bar"
                        height={120}
                        width="100%"
                      />
                    </div>
                  ) : (
                    <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
                      No historical data
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
