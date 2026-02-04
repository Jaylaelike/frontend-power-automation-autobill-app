import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ stationName: string }> }
) {
  try {
    const { stationName } = await params;
    
    console.log('Looking for station:', stationName);
    
    // Try exact match first, then contains
    let station: any = await (prisma.station as any).findFirst({
      where: {
        name: stationName
      },
      include: {
        powerReadings: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
        modbusConfig: true,
      },
    });

    // If exact match fails, try contains
    if (!station) {
      station = await (prisma.station as any).findFirst({
        where: {
          name: {
            contains: stationName
          }
        },
        include: {
          powerReadings: {
            orderBy: {
              timestamp: "desc",
            },
            take: 1,
          },
          modbusConfig: true,
        },
      });
    }

    if (!station) {
      return NextResponse.json(
        { error: `Station '${stationName}' not found` },
        { status: 404 }
      );
    }

    if (station.powerReadings.length === 0) {
      return NextResponse.json(
        { error: `No power readings found for station '${stationName}'` },
        { status: 404 }
      );
    }

    const latestReading = station.powerReadings[0];
    
    // Calculate total MUX power
    const totalMuxPower = (
      (latestReading.muxPower1 || 0) +
      (latestReading.muxPower2 || 0) +
      (latestReading.muxPower3 || 0) +
      (latestReading.muxPower4 || 0) +
      (latestReading.muxPower5 || 0) +
      (latestReading.muxPower6 || 0)
    );

    const stationData = {
      stationName: station.name,
      lastUpdate: latestReading.timestamp.toISOString(),
      muxPower1: latestReading.muxPower1 || 0,
      muxPower2: latestReading.muxPower2 || 0,
      muxPower3: latestReading.muxPower3 || 0,
      muxPower4: latestReading.muxPower4 || 0,
      muxPower5: latestReading.muxPower5 || 0,
      muxPower6: latestReading.muxPower6 || 0,
      totalMuxPower: totalMuxPower,
      // Modbus channel labels
      modbusLabel1: station.modbusConfig?.modbus1 || null,
      modbusLabel2: station.modbusConfig?.modbus2 || null,
      modbusLabel3: station.modbusConfig?.modbus3 || null,
      modbusLabel4: station.modbusConfig?.modbus4 || null,
      modbusLabel5: station.modbusConfig?.modbus5 || null,
      modbusLabel6: station.modbusConfig?.modbus6 || null,
      // Additional details
      stationId: station.id,
      ipAddress: station.ipAddress,
      scene: station.scene,
      readingId: latestReading.id,
      readingTimestamp: latestReading.timestamp,
      // Active Power readings if available
      activePower1: latestReading.activePower1,
      activePower2: latestReading.activePower2,
      activePower3: latestReading.activePower3,
      activePower4: latestReading.activePower4,
      activePower5: latestReading.activePower5,
      activePower6: latestReading.activePower6,
    };
    
    return NextResponse.json(stationData);
  } catch (error) {
    console.error("Error fetching station data:", error);
    return NextResponse.json(
      { error: "Failed to fetch station data" },
      { status: 500 }
    );
  }
}
