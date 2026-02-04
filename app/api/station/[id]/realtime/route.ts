import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import type { RealtimeDataResponse, RealtimeDataPoint } from "@/lib/types/station";

const prisma = new PrismaClient();

// Filter readings by time window
export function filterByTimeWindow(
  readings: Array<{
    id: string;
    stationId: string;
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
  windowMinutes: number,
  referenceTime: Date = new Date()
): RealtimeDataPoint[] {
  const windowStart = new Date(referenceTime.getTime() - windowMinutes * 60 * 1000);

  return readings
    .filter((r) => r.timestamp >= windowStart && r.timestamp <= referenceTime)
    .map((reading) => {
      // Use pre-calculated totals from database if available
      const totalActivePower = (reading.totalActivePower !== null && reading.totalActivePower !== undefined)
        ? reading.totalActivePower
        : (reading.activePower1 || 0) +
          (reading.activePower2 || 0) +
          (reading.activePower3 || 0) +
          (reading.activePower4 || 0) +
          (reading.activePower5 || 0) +
          (reading.activePower6 || 0);

      const totalMuxPower = (reading.totalMuxPower !== null && reading.totalMuxPower !== undefined)
        ? reading.totalMuxPower
        : (reading.muxPower1 || 0) +
          (reading.muxPower2 || 0) +
          (reading.muxPower3 || 0) +
          (reading.muxPower4 || 0) +
          (reading.muxPower5 || 0) +
          (reading.muxPower6 || 0);

      return {
        timestamp: reading.timestamp.toISOString(),
        activePower1: reading.activePower1,
        activePower2: reading.activePower2,
        activePower3: reading.activePower3,
        activePower4: reading.activePower4,
        activePower5: reading.activePower5,
        activePower6: reading.activePower6,
        muxPower1: reading.muxPower1,
        muxPower2: reading.muxPower2,
        muxPower3: reading.muxPower3,
        muxPower4: reading.muxPower4,
        muxPower5: reading.muxPower5,
        muxPower6: reading.muxPower6,
        totalActivePower,
        totalMuxPower,
      };
    });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Get time window in minutes (default 30)
    const minutesParam = searchParams.get("minutes");
    const minutes = minutesParam ? parseInt(minutesParam, 10) : 30;

    if (isNaN(minutes) || minutes <= 0) {
      return NextResponse.json(
        { error: "Invalid minutes parameter. Must be a positive number.", code: "INVALID_MINUTES" },
        { status: 400 }
      );
    }

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

    // Calculate time window
    const now = new Date();
    const windowStart = new Date(now.getTime() - minutes * 60 * 1000);

    // Fetch readings within time window
    const readings = await prisma.powerReading.findMany({
      where: {
        stationId: id,
        timestamp: {
          gte: windowStart,
          lte: now,
        },
      },
      orderBy: { timestamp: "asc" },
    });

    // Transform readings to response format
    const realtimeData = filterByTimeWindow(readings, minutes, now);

    const response: RealtimeDataResponse = {
      stationId: id,
      readings: realtimeData,
      latestTimestamp: realtimeData.length > 0 
        ? realtimeData[realtimeData.length - 1].timestamp 
        : now.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching realtime data:", error);
    return NextResponse.json(
      { error: "Failed to fetch realtime data", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
