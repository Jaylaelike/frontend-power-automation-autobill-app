import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  eachHourOfInterval,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import type {
  TimePeriod,
  HistoricalDataResponse,
  AggregatedDataPoint,
  APIErrorResponse,
} from "@/lib/types/station";

const prisma = new PrismaClient();

// Validation function for date range
export function validateDateRange(
  from: string | null,
  to: string | null,
  period: string | null
): APIErrorResponse | null {
  if (!from || from.trim() === '') {
    return { error: "Missing required parameter: from", code: "MISSING_FROM_DATE" };
  }
  if (!to || to.trim() === '') {
    return { error: "Missing required parameter: to", code: "MISSING_TO_DATE" };
  }
  if (!period || period.trim() === '') {
    return { error: "Missing required parameter: period", code: "MISSING_PERIOD" };
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (isNaN(fromDate.getTime())) {
    return { error: "Invalid start date format", code: "INVALID_FROM_DATE" };
  }
  if (isNaN(toDate.getTime())) {
    return { error: "Invalid end date format", code: "INVALID_TO_DATE" };
  }
  if (fromDate > toDate) {
    return { error: "Start date must be before end date", code: "INVALID_DATE_RANGE" };
  }
  if (toDate > new Date()) {
    return { error: "End date cannot be in the future", code: "FUTURE_DATE" };
  }

  const validPeriods: TimePeriod[] = ["day", "week", "month", "year"];
  if (!validPeriods.includes(period as TimePeriod)) {
    return {
      error: "Invalid period. Must be one of: day, week, month, year",
      code: "INVALID_PERIOD",
    };
  }

  return null;
}

// Get time intervals based on period
function getTimeIntervals(from: Date, to: Date, period: TimePeriod) {
  switch (period) {
    case "day":
      return eachHourOfInterval({ start: startOfDay(from), end: endOfDay(to) });
    case "week":
      return eachDayOfInterval({ start: startOfWeek(from), end: endOfWeek(to) });
    case "month":
      return eachDayOfInterval({ start: startOfMonth(from), end: endOfMonth(to) });
    case "year":
      return eachMonthOfInterval({ start: startOfYear(from), end: endOfYear(to) });
  }
}

// Get label format based on period
function getLabelFormat(period: TimePeriod): string {
  switch (period) {
    case "day":
      return "HH:00";
    case "week":
      return "EEE";
    case "month":
      return "MMM dd";
    case "year":
      return "MMM";
  }
}

// Get the latest reading for a time interval (no summing - use actual values)
export function getLatestReadingForInterval(
  readings: Array<{
    timestamp: Date;
    activePower1: number | null;
    activePower2: number | null;
    activePower3: number | null;
    activePower4: number | null;
    activePower5: number | null;
    activePower6: number | null;
    muxPower1: number | null;
    muxPower2: number | null;
    muxPower3: number | null;
    muxPower4: number | null;
    muxPower5: number | null;
    muxPower6: number | null;
    totalActivePower?: number | null;
    totalMuxPower?: number | null;
  }>,
  intervalStart: Date,
  intervalEnd: Date,
  label: string
): AggregatedDataPoint {
  const intervalReadings = readings.filter(
    (r) => r.timestamp >= intervalStart && r.timestamp < intervalEnd
  );

  if (intervalReadings.length === 0) {
    return {
      label,
      timestamp: intervalStart.toISOString(),
      activePowerSum: 0,
      activePowerAvg: 0,
      muxPowerSum: 0,
      muxPowerAvg: 0,
      readingCount: 0,
    };
  }

  // Get the latest reading in this interval (most recent data point)
  const latestReading = intervalReadings[intervalReadings.length - 1];

  // Use totalActivePower and totalMuxPower from database directly (no summing)
  let activePowerValue = 0;
  let muxPowerValue = 0;

  // Use pre-calculated totals from database if available
  if (latestReading.totalActivePower !== null && latestReading.totalActivePower !== undefined) {
    activePowerValue = latestReading.totalActivePower;
  } else {
    // Fallback to calculating from individual values for this single reading
    activePowerValue =
      (latestReading.activePower1 || 0) +
      (latestReading.activePower2 || 0) +
      (latestReading.activePower3 || 0) +
      (latestReading.activePower4 || 0) +
      (latestReading.activePower5 || 0) +
      (latestReading.activePower6 || 0);
  }

  // Use pre-calculated totals from database if available
  if (latestReading.totalMuxPower !== null && latestReading.totalMuxPower !== undefined) {
    muxPowerValue = latestReading.totalMuxPower;
  } else {
    // Fallback to calculating from individual values for this single reading
    muxPowerValue =
      (latestReading.muxPower1 || 0) +
      (latestReading.muxPower2 || 0) +
      (latestReading.muxPower3 || 0) +
      (latestReading.muxPower4 || 0) +
      (latestReading.muxPower5 || 0) +
      (latestReading.muxPower6 || 0);
  }

  return {
    label,
    timestamp: latestReading.timestamp.toISOString(),
    activePowerSum: activePowerValue, // This is now the actual value, not a sum
    activePowerAvg: activePowerValue,
    muxPowerSum: muxPowerValue, // This is now the actual value, not a sum
    muxPowerAvg: muxPowerValue,
    readingCount: intervalReadings.length,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const period = searchParams.get("period");

    // Validate parameters
    const validationError = validateDateRange(from, to, period);
    if (validationError) {
      return NextResponse.json(validationError, { status: 400 });
    }

    const fromDate = new Date(from!);
    const toDate = new Date(to!);
    const timePeriod = period as TimePeriod;

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

    // Fetch readings within date range
    const readings = await prisma.powerReading.findMany({
      where: {
        stationId: id,
        timestamp: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { timestamp: "asc" },
    });

    // Get time intervals and aggregate data
    const intervals = getTimeIntervals(fromDate, toDate, timePeriod);
    const labelFormat = getLabelFormat(timePeriod);

    const aggregatedData: AggregatedDataPoint[] = [];

    for (let i = 0; i < intervals.length; i++) {
      const intervalStart = intervals[i];
      const intervalEnd = intervals[i + 1] || toDate;
      const label = format(intervalStart, labelFormat);

      aggregatedData.push(
        getLatestReadingForInterval(readings, intervalStart, intervalEnd, label)
      );
    }

    const response: HistoricalDataResponse = {
      stationId: id,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      timePeriod,
      data: aggregatedData,
      metadata: {
        totalReadings: readings.length,
        aggregationMethod: "latest", // Changed from "sum" to "latest"
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical data", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
