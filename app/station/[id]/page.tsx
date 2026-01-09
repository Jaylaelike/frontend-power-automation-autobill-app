"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { StationHeader } from "@/components/station-header";
import { DateRangePicker } from "@/components/date-range-picker";
import { TimePeriodSelector } from "@/components/time-period-selector";
import { HistoricalBarChart } from "@/components/historical-bar-chart";
import { PowerSummaryCards } from "@/components/power-summary-cards";
import { MuxPowerBreakdown } from "@/components/mux-power-breakdown";
import { ActivePowerBreakdown } from "@/components/active-power-breakdown";
import { PageLayout } from "@/components/page-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { subDays } from "date-fns";
import type { 
  StationDetailResponse, 
  HistoricalDataResponse, 
  RealtimeDataResponse,
  DateRange,
  TimePeriod 
} from "@/lib/types/station";

export default function StationDetailPage() {
  const params = useParams();
  const stationId = params.id as string;

  // State for date range and time period
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7), // Default to last 7 days
    to: new Date(),
  });
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');

  // Station detail query
  const { data: stationData, isLoading: stationLoading, error: stationError, refetch: refetchStation } = useQuery({
    queryKey: ["station-detail", stationId],
    queryFn: async (): Promise<StationDetailResponse> => {
      const response = await fetch(`/api/station/${stationId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch station detail");
      }
      return response.json();
    },
    enabled: !!stationId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Historical data query
  const { data: historicalData, isLoading: historicalLoading, error: historicalError } = useQuery({
    queryKey: ["historical-data", stationId, dateRange.from.toISOString(), dateRange.to.toISOString(), timePeriod],
    queryFn: async (): Promise<HistoricalDataResponse> => {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        period: timePeriod,
      });
      const response = await fetch(`/api/station/${stationId}/historical?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch historical data");
      }
      return response.json();
    },
    enabled: !!stationId && !!dateRange.from && !!dateRange.to,
  });

  // Real-time data query
  const { data: realtimeData, isLoading: realtimeLoading, error: realtimeError, refetch: refetchRealtime } = useQuery({
    queryKey: ["realtime-data", stationId],
    queryFn: async (): Promise<RealtimeDataResponse> => {
      const response = await fetch(`/api/station/${stationId}/realtime?minutes=30`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch real-time data");
      }
      return response.json();
    },
    enabled: !!stationId,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time data
  });

  // Handle date range changes
  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  // Handle time period changes
  const handleTimePeriodChange = (newPeriod: TimePeriod) => {
    setTimePeriod(newPeriod);
  };

  if (stationLoading) {
    return (
      <PageLayout>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </PageLayout>
    );
  }

  if (stationError) {
    return (
      <PageLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {stationError.message}
            <button
              onClick={() => refetchStation()}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      </PageLayout>
    );
  }

  if (!stationData) {
    return (
      <PageLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No station data available.</AlertDescription>
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Station Header */}
        <StationHeader station={stationData.station} isLoading={false} />

        {/* Date Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Data Controls</CardTitle>
            <CardDescription>
              Select date range and time period for historical data analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                className="flex-1"
              />
              <TimePeriodSelector
                selectedPeriod={timePeriod}
                onPeriodChange={handleTimePeriodChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Power Summary Cards */}
        <PowerSummaryCards
          realtimeData={realtimeData?.readings || []}
          historicalData={historicalData?.data || []}
          isLoading={realtimeLoading || historicalLoading}
          error={realtimeError?.message || historicalError?.message || null}
        />

        {/* Charts */}
        <div className="space-y-6">
          {/* Historical Bar Chart */}
          <HistoricalBarChart
            data={historicalData?.data || []}
            dateRange={dateRange}
            timePeriod={timePeriod}
            isLoading={historicalLoading}
            error={historicalError?.message || null}
          />

          {/* Active Power Breakdown */}
          <ActivePowerBreakdown
            stationId={stationId}
            isLoading={false}
            error={null}
          />

          {/* MUX Power Breakdown */}
          <MuxPowerBreakdown
            data={realtimeData?.readings || []}
            isLoading={realtimeLoading}
            error={realtimeError?.message || null}
          />
        </div>
      </div>
    </PageLayout>
  );
}
