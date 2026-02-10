"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, TrendingUp, Download, Calendar } from "lucide-react";
import { exportMuxPowerAnalyticsToCSV } from "@/lib/station-csv-export";
import { subDays, subWeeks, subMonths, subYears, format } from "date-fns";
import type { RealtimeDataPoint, ModbusConfig } from "@/lib/types/station";

interface MuxPowerBreakdownProps {
  data: RealtimeDataPoint[];
  stationName?: string;
  stationId?: string;
  modbusConfig?: ModbusConfig | null;
  isLoading?: boolean;
  error?: string | null;
}

interface MuxChannelAnalytics {
  channel: number;
  day: { min: number; max: number; avg: number; count: number };
  week: { min: number; max: number; avg: number; count: number };
  month: { min: number; max: number; avg: number; count: number };
  year: { min: number; max: number; avg: number; count: number };
}

type TimePeriodKey = 'day' | 'week' | 'month' | 'year';

// Color palette for each MUX channel
const MUX_COLORS = [
  { primary: '#3b82f6', gradient: '#60a5fa', bg: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900', text: 'text-blue-700 dark:text-blue-300' },
  { primary: '#10b981', gradient: '#34d399', bg: 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900', text: 'text-green-700 dark:text-green-300' },
  { primary: '#f59e0b', gradient: '#fbbf24', bg: 'from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900', text: 'text-amber-700 dark:text-amber-300' },
  { primary: '#ef4444', gradient: '#f87171', bg: 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900', text: 'text-red-700 dark:text-red-300' },
  { primary: '#8b5cf6', gradient: '#a78bfa', bg: 'from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900', text: 'text-violet-700 dark:text-violet-300' },
  { primary: '#ec4899', gradient: '#f472b6', bg: 'from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900', text: 'text-pink-700 dark:text-pink-300' },
];

// Get modbus channel name for display
function getModbusChannelName(index: number, modbusConfig?: ModbusConfig | null): string {
  if (!modbusConfig) return `MUX Power ${index}`;
  
  const modbusKey = `modbus${index}` as keyof ModbusConfig;
  const channelName = modbusConfig[modbusKey];
  
  if (channelName) {
    return `MUX ${index} - ${channelName}`;
  }
  return `MUX Power ${index}`;
}

export function MuxPowerBreakdown({
  data,
  stationName,
  stationId,
  modbusConfig,
  isLoading = false,
  error = null,
}: MuxPowerBreakdownProps) {
  const [analytics, setAnalytics] = React.useState<MuxChannelAnalytics[] | null>(null);
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
        const response = await fetch(`/api/station/${stationId}/mux-analytics`);
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

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExportCSV = () => {
    if (!stationName || !stationId || !analytics) return;
    
    exportMuxPowerAnalyticsToCSV({
      stationName,
      stationId,
      analytics,
      selectedPeriod,
      modbusConfig,
    });
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

  const getAnalyticsForChannel = (channelIndex: number) => {
    if (!analytics) return null;
    return analytics.find(a => a.channel === channelIndex);
  };

  const formatPowerValue = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}kW`;
    }
    return `${value}W`;
  };

  if (error || analyticsError) {
    return (
      <Card className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">MUX Power Breakdown</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <p>Error: {error || analyticsError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || analyticsLoading) {
    return (
      <Card className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">MUX Power Breakdown</CardTitle>
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

  return (
    <Card className="shadow-sm border-0 bg-linear-to-br from-background to-muted/20">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">MUX Power Breakdown</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Historical power data for each MUX channel (1-6)
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
              {stationName && stationId && analytics && (
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
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
            const color = MUX_COLORS[channelIndex - 1];
            const channelName = getModbusChannelName(channelIndex, modbusConfig);
            
            // Get latest value from realtime data
            const channelKey = `muxPower${channelIndex}` as keyof RealtimeDataPoint;
            const latestValue = data.length > 0 ? (data[data.length - 1][channelKey] as number | null) || 0 : 0;
            
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

                  {/* Latest Value Display */}
                  <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Latest Reading
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: color.primary }}>
                        {latestValue} W
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(latestValue / 1000).toFixed(2)} kW
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
