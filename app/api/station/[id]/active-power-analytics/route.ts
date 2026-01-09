import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { subDays, subWeeks, subMonths, subYears, format, eachHourOfInterval, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";

const prisma = new PrismaClient();

interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ActivePowerChannelAnalytics {
  channel: number;
  day: { min: number; max: number; avg: number; count: number; chartData: ChartDataPoint[] };
  week: { min: number; max: number; avg: number; count: number; chartData: ChartDataPoint[] };
  month: { min: number; max: number; avg: number; count: number; chartData: ChartDataPoint[] };
  year: { min: number; max: number; avg: number; count: number; chartData: ChartDataPoint[] };
}

export interface ActivePowerAnalyticsResponse {
  stationId: string;
  timestamp: string;
  channels: ActivePowerChannelAnalytics[];
  debug?: {
    timeRanges: {
      day: { from: string; to: string };
      week: { from: string; to: string };
      month: { from: string; to: string };
      year: { from: string; to: string };
    };
  };
}

// Get channel stats and chart data
async function getChannelStatsWithChart(
  stationId: string,
  channelIndex: number,
  fromDate: Date,
  toDate: Date,
  period: 'day' | 'week' | 'month' | 'year'
): Promise<{ min: number; max: number; avg: number; count: number; chartData: ChartDataPoint[] }> {
  const channelKey = `activePower${channelIndex}` as 
    | 'activePower1' | 'activePower2' | 'activePower3' 
    | 'activePower4' | 'activePower5' | 'activePower6';
  
  try {
    // Fetch all readings in the time range
    const readings = await prisma.powerReading.findMany({
      where: {
        stationId,
        timestamp: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        timestamp: true,
        [channelKey]: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Extract and filter valid values (not null, not 0)
    const values: number[] = [];
    for (const reading of readings) {
      const val = reading[channelKey];
      if (val !== null && val !== undefined && val > 0) {
        values.push(val);
      }
    }

    // Calculate min, max, avg
    let min = 0, max = 0, avg = 0;
    if (values.length > 0) {
      min = Math.round(Math.min(...values));
      max = Math.round(Math.max(...values));
      avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }

    // Generate chart data based on period
    const readingsForChart = readings.map(r => ({
      timestamp: r.timestamp,
      value: r[channelKey] as number | null,
    }));
    const chartData = generateChartData(readingsForChart, fromDate, toDate, period);

    return {
      min,
      max,
      avg,
      count: values.length,
      chartData,
    };
  } catch (error) {
    console.error(`Error fetching stats for active power channel ${channelIndex}:`, error);
    return { min: 0, max: 0, avg: 0, count: 0, chartData: [] };
  }
}

// Generate aggregated chart data based on period
function generateChartData(
  readings: Array<{ timestamp: Date; value: number | null }>,
  fromDate: Date,
  toDate: Date,
  period: 'day' | 'week' | 'month' | 'year'
): ChartDataPoint[] {
  let intervals: Date[];
  let labelFormat: string;

  switch (period) {
    case 'day':
      // Hourly intervals for day view
      intervals = eachHourOfInterval({ start: fromDate, end: toDate });
      labelFormat = 'HH:00';
      break;
    case 'week':
      // Daily intervals for week view
      intervals = eachDayOfInterval({ start: fromDate, end: toDate });
      labelFormat = 'EEE';
      break;
    case 'month':
      // Daily intervals for month view (show every few days)
      intervals = eachDayOfInterval({ start: fromDate, end: toDate });
      labelFormat = 'dd';
      break;
    case 'year':
      // Monthly intervals for year view
      intervals = eachMonthOfInterval({ start: fromDate, end: toDate });
      labelFormat = 'MMM';
      break;
  }

  // Aggregate readings into intervals
  const chartData: ChartDataPoint[] = [];
  
  for (let i = 0; i < intervals.length; i++) {
    const intervalStart = intervals[i];
    const intervalEnd = intervals[i + 1] || toDate;
    
    // Find readings in this interval
    const intervalReadings = readings.filter(r => {
      const timestamp = new Date(r.timestamp);
      return timestamp >= intervalStart && timestamp < intervalEnd;
    });

    // Calculate average for this interval
    const validValues = intervalReadings
      .map(r => r.value)
      .filter((v): v is number => v !== null && v > 0);

    const avgValue = validValues.length > 0
      ? Math.round(validValues.reduce((a, b) => a + b, 0) / validValues.length)
      : 0;

    chartData.push({
      label: format(intervalStart, labelFormat),
      value: avgValue,
    });
  }

  // Limit data points for better visualization
  if (period === 'month' && chartData.length > 15) {
    // Sample every 2nd day for month view
    return chartData.filter((_, i) => i % 2 === 0);
  }

  return chartData;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const now = new Date();

    // Check if station exists
    const station = await prisma.station.findUnique({
      where: { id },
    });

    if (!station) {
      return NextResponse.json(
        { error: "Station not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Define proper time ranges
    const dayStart = subDays(now, 1);
    const weekStart = subWeeks(now, 1);
    const monthStart = subMonths(now, 1);
    const yearStart = subYears(now, 1);

    // Get analytics for each channel using parallel queries
    const channelPromises: Promise<ActivePowerChannelAnalytics>[] = [];
    
    for (let i = 1; i <= 6; i++) {
      const channelPromise = Promise.all([
        getChannelStatsWithChart(id, i, dayStart, now, 'day'),
        getChannelStatsWithChart(id, i, weekStart, now, 'week'),
        getChannelStatsWithChart(id, i, monthStart, now, 'month'),
        getChannelStatsWithChart(id, i, yearStart, now, 'year'),
      ]).then(([dayStats, weekStats, monthStats, yearStats]) => ({
        channel: i,
        day: dayStats,
        week: weekStats,
        month: monthStats,
        year: yearStats,
      }));
      
      channelPromises.push(channelPromise);
    }

    const channels = await Promise.all(channelPromises);

    const response: ActivePowerAnalyticsResponse = {
      stationId: id,
      timestamp: now.toISOString(),
      channels,
      debug: {
        timeRanges: {
          day: { from: dayStart.toISOString(), to: now.toISOString() },
          week: { from: weekStart.toISOString(), to: now.toISOString() },
          month: { from: monthStart.toISOString(), to: now.toISOString() },
          year: { from: yearStart.toISOString(), to: now.toISOString() },
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching Active Power analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch Active Power analytics", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
