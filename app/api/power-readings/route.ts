import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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
    })

    // Transform the data to include latestReading
    const stationsWithLatestReading = stations.map((station) => ({
      id: station.id,
      name: station.name,
      ipAddress: station.ipAddress,
      scene: station.scene,
      createdAt: station.createdAt,
      updatedAt: station.updatedAt,
      latestReading: station.powerReadings[0] || null,
    }))

    return NextResponse.json({
      stations: stationsWithLatestReading,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching power readings:", error)
    return NextResponse.json({ error: "Failed to fetch power readings" }, { status: 500 })
  }
}
