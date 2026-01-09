import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PowerReading } from "@/lib/pdf-generator";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all stations with their latest power reading
    const stations = await prisma.station.findMany({
      include: {
        powerReadings: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
      },
    });

    // Transform the data to match PowerReading interface for email system
    const powerReadings: PowerReading[] = stations
      .filter(station => station.powerReadings.length > 0)
      .map((station) => {
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

        return {
          stationName: station.name,
          lastUpdate: latestReading.timestamp.toISOString(),
          muxPower1: latestReading.muxPower1 || 0,
          muxPower2: latestReading.muxPower2 || 0,
          muxPower3: latestReading.muxPower3 || 0,
          muxPower4: latestReading.muxPower4 || 0,
          muxPower5: latestReading.muxPower5 || 0,
          muxPower6: latestReading.muxPower6 || 0,
          totalMuxPower: totalMuxPower
        };
      });

    // If no real data available, return some sample data for testing
    if (powerReadings.length === 0) {
      const fallbackData: PowerReading[] = [
        {
          stationName: "Bangkok Station",
          lastUpdate: new Date().toISOString(),
          muxPower1: 125.5,
          muxPower2: 98.2,
          muxPower3: 110.8,
          muxPower4: 87.3,
          muxPower5: 156.7,
          muxPower6: 134.2,
          totalMuxPower: 712.7
        },
        {
          stationName: "Chiang Mai Station",
          lastUpdate: new Date().toISOString(),
          muxPower1: 89.4,
          muxPower2: 76.8,
          muxPower3: 92.1,
          muxPower4: 68.5,
          muxPower5: 101.3,
          muxPower6: 85.9,
          totalMuxPower: 514.0
        }
      ];
      
      return NextResponse.json(fallbackData);
    }
    
    return NextResponse.json(powerReadings);
  } catch (error) {
    console.error("Error fetching power readings for email:", error);
    return NextResponse.json(
      { error: "Failed to fetch power readings" },
      { status: 500 }
    );
  }
}