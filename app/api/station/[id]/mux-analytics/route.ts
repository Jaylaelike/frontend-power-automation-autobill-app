import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { subDays, subWeeks, subMonths, subYears } from "date-fns";

const prisma = new PrismaClient();

export interface MuxChannelAnalytics {
  channel: number;
  day: { min: number; max: number; avg: number; count: number };
  week: { min: number; max: number; avg: number; count: number };
  month: { min: number; max: number; avg: number; count: number };
  year: { min: number; max: number; avg: number; count: number };
}

export interface MuxAnalyticsResponse {
  stationId: string;
  timestamp: string;
  channels: MuxChannelAnalytics[];
  debug?: {
    timeRanges: {
      day: { from: string; to: string };
      week: { from: string; to: string };
      month: { from: string; to: string };
      year: { from: string; to: string };
    };
    rawCounts: {
      day: number;
      week: number;
      month: number;
      year: number;
    };
  };
}

// Get channel stats using Prisma findMany and manual calculation
async function getChannelStats(
  stationId: string,
  channelIndex: number,
  fromDate: Date,
  toDate: Date
): Promise<{ min: number; max: number; avg: number; count: number }> {
  const channelKey = `muxPower${channelIndex}` as 
    | 'muxPower1' | 'muxPower2' | 'muxPower3' 
    | 'muxPower4' | 'muxPower5' | 'muxPower6';
  
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
        [channelKey]: true,
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

    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 };
    }

    // Calculate min, max, avg manually
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    return {
      min: Math.round(min),
      max: Math.round(max),
      avg: Math.round(avg),
      count: values.length,
    };
  } catch (error) {
    console.error(`Error fetching stats for MUX power channel ${channelIndex}:`, error);
    return { min: 0, max: 0, avg: 0, count: 0 };
  }
}

// Get total count for debugging
async function getTotalCount(stationId: string, fromDate: Date, toDate: Date): Promise<number> {
  const count = await prisma.powerReading.count({
    where: {
      stationId,
      timestamp: {
        gte: fromDate,
        lte: toDate,
      },
    },
  });
  return count;
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

    // Define proper time ranges - each period is distinct
    // Day: Last 24 hours
    const dayStart = subDays(now, 1);
    
    // Week: Last 7 days  
    const weekStart = subWeeks(now, 1);
    
    // Month: Last 30 days
    const monthStart = subMonths(now, 1);
    
    // Year: Last 365 days
    const yearStart = subYears(now, 1);

    // Get debug counts
    const [dayCount, weekCount, monthCount, yearCount] = await Promise.all([
      getTotalCount(id, dayStart, now),
      getTotalCount(id, weekStart, now),
      getTotalCount(id, monthStart, now),
      getTotalCount(id, yearStart, now),
    ]);

    // Get analytics for each channel using parallel queries
    const channelPromises: Promise<MuxChannelAnalytics>[] = [];
    
    for (let i = 1; i <= 6; i++) {
      const channelPromise = Promise.all([
        getChannelStats(id, i, dayStart, now),
        getChannelStats(id, i, weekStart, now),
        getChannelStats(id, i, monthStart, now),
        getChannelStats(id, i, yearStart, now),
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

    const response: MuxAnalyticsResponse = {
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
        rawCounts: {
          day: dayCount,
          week: weekCount,
          month: monthCount,
          year: yearCount,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching MUX Power analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch MUX Power analytics", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
