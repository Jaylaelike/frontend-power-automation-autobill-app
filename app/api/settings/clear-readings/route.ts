import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// DELETE - Clear all power readings
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get("confirm");

    // Require confirmation parameter
    if (confirm !== "true") {
      return NextResponse.json(
        { 
          error: "Confirmation required",
          message: "Add ?confirm=true to confirm deletion of all power readings"
        },
        { status: 400 }
      );
    }

    // Get current count before deletion
    const currentCount = await prisma.powerReading.count();

    if (currentCount === 0) {
      return NextResponse.json({
        message: "Table is already empty",
        deletedCount: 0,
        previousCount: 0,
      });
    }

    // Delete all records
    const deleteResult = await prisma.powerReading.deleteMany({});

    // Verify deletion
    const finalCount = await prisma.powerReading.count();

    return NextResponse.json({
      message: "Power readings cleared successfully",
      deletedCount: deleteResult.count,
      previousCount: currentCount,
      remainingCount: finalCount,
    });
  } catch (error) {
    console.error("Error clearing power readings:", error);
    return NextResponse.json(
      { error: "Failed to clear power readings" },
      { status: 500 }
    );
  }
}

// GET - Get power readings count and stats
export async function GET() {
  try {
    const [count, oldestReading, newestReading] = await Promise.all([
      prisma.powerReading.count(),
      prisma.powerReading.findFirst({ 
        orderBy: { timestamp: "asc" }, 
        select: { timestamp: true } 
      }),
      prisma.powerReading.findFirst({ 
        orderBy: { timestamp: "desc" }, 
        select: { timestamp: true } 
      }),
    ]);

    // Calculate approximate database size (rough estimate)
    const estimatedSizeBytes = count * 200; // ~200 bytes per record estimate
    const estimatedSizeMB = (estimatedSizeBytes / (1024 * 1024)).toFixed(2);

    return NextResponse.json({
      count,
      oldestReading: oldestReading?.timestamp || null,
      newestReading: newestReading?.timestamp || null,
      estimatedSizeMB: parseFloat(estimatedSizeMB),
    });
  } catch (error) {
    console.error("Error fetching power readings stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch power readings stats" },
      { status: 500 }
    );
  }
}
