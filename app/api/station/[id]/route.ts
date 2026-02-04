import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import type { StationDetailResponse, StationStatus } from "@/lib/types/station";

const prisma = new PrismaClient();

function calculateStatus(timestamp: Date | null): StationStatus {
  if (!timestamp) return 'offline';
  
  const now = new Date();
  const diffMinutes = (now.getTime() - timestamp.getTime()) / 1000 / 60;
  
  if (diffMinutes > 5) return 'stale';
  return 'active';
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const station = await prisma.station.findUnique({
      where: { id },
      include: {
        powerReadings: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
        modbusConfig: true,
      },
    });

    if (!station) {
      return NextResponse.json(
        { error: "Station not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const latestReading = station.powerReadings[0] || null;
    const status = calculateStatus(latestReading?.timestamp || null);

    const response: StationDetailResponse = {
      station: {
        id: station.id,
        name: station.name,
        ipAddress: station.ipAddress,
        scene: station.scene,
        status,
        latestReading: latestReading
          ? {
              id: latestReading.id,
              stationId: latestReading.stationId,
              timestamp: latestReading.timestamp.toISOString(),
              activePower1: latestReading.activePower1,
              activePower2: latestReading.activePower2,
              activePower3: latestReading.activePower3,
              activePower4: latestReading.activePower4,
              activePower5: latestReading.activePower5,
              activePower6: latestReading.activePower6,
              muxPower1: latestReading.muxPower1,
              muxPower2: latestReading.muxPower2,
              muxPower3: latestReading.muxPower3,
              muxPower4: latestReading.muxPower4,
              muxPower5: latestReading.muxPower5,
              muxPower6: latestReading.muxPower6,
              totalActivePower: latestReading.totalActivePower,
              totalMuxPower: latestReading.totalMuxPower,
            }
          : null,
        modbusConfig: station.modbusConfig
          ? {
              modbus1: station.modbusConfig.modbus1,
              modbus2: station.modbusConfig.modbus2,
              modbus3: station.modbusConfig.modbus3,
              modbus4: station.modbusConfig.modbus4,
              modbus5: station.modbusConfig.modbus5,
              modbus6: station.modbusConfig.modbus6,
            }
          : null,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching station detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch station detail", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
