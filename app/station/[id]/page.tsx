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
import { StationReportActions } from "@/components/station-report-actions";
import { StationBillingCard } from "@/components/station-billing-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download } from "lucide-react";
import { subDays } from "date-fns";
import { exportStationDataToCSV } from "@/lib/station-csv-export";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

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

  // Handle CSV export
  const handleExportCSV = () => {
    if (!stationData || !historicalData || historicalData.data.length === 0) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "No data available to export",
      });
      return;
    }

    try {
      exportStationDataToCSV({
        station: stationData.station,
        data: historicalData.data,
        dateRange,
        timePeriod,
      });
      toast({
        title: "Export Successful",
        description: "Data has been exported to CSV file",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
      });
    }
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

        {/* Report & Email Actions */}
        <StationReportActions station={stationData.station} />

        {/* Per-Station Billing */}
        <StationBillingCard stationId={stationId} stationName={stationData.station.name} />
        {/* Date Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Data Controls</CardTitle>
                <CardDescription>
                  Select date range and time period for historical data analysis
                </CardDescription>
              </div>
              <Button
                onClick={handleExportCSV}
                disabled={historicalLoading || !historicalData || historicalData.data.length === 0}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
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
            station={stationData.station}
            isLoading={historicalLoading}
            error={historicalError?.message || null}
          />

          {/* Active Power Breakdown */}
          <ActivePowerBreakdown
            stationId={stationId}
            stationName={stationData.station.name}
            modbusConfig={stationData.station.modbusConfig}
            isLoading={false}
            error={null}
          />

          {/* MUX Power Breakdown */}
          <MuxPowerBreakdown
            data={realtimeData?.readings || []}
            stationName={stationData.station.name}
            stationId={stationId}
            modbusConfig={stationData.station.modbusConfig}
            isLoading={realtimeLoading}
            error={realtimeError?.message || null}
          />
        </div>
      </div>
    </PageLayout>
  );
}
