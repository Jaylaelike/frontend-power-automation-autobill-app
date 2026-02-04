import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Settings file path (stored in project root - same level as monitor.js)
const SETTINGS_FILE = path.join(process.cwd(), "..", "..", "monitor-settings.json");

// Default settings
const DEFAULT_SETTINGS = {
  dbSaveInterval: 30000, // 30 seconds
  updateRate: 3000, // 3 seconds
  connectionTimeout: 10000, // 10 seconds
  reconnectInterval: 5000, // 5 seconds
  maxReconnectAttempts: 10,
};

// Read settings from file
function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error("Error reading settings file:", error);
  }
  return DEFAULT_SETTINGS;
}

// Write settings to file
function writeSettings(settings: typeof DEFAULT_SETTINGS) {
  try {
    // Ensure directory exists
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log("Settings saved to:", SETTINGS_FILE);
    return true;
  } catch (error) {
    console.error("Error writing settings file:", error);
    return false;
  }
}

// GET - Retrieve current settings and database stats
export async function GET() {
  try {
    const settings = readSettings();
    
    // Get database statistics
    const [powerReadingCount, stationCount, oldestReading, newestReading] = await Promise.all([
      prisma.powerReading.count(),
      prisma.station.count(),
      prisma.powerReading.findFirst({ orderBy: { timestamp: "asc" }, select: { timestamp: true } }),
      prisma.powerReading.findFirst({ orderBy: { timestamp: "desc" }, select: { timestamp: true } }),
    ]);

    return NextResponse.json({
      settings,
      database: {
        powerReadingCount,
        stationCount,
        oldestReading: oldestReading?.timestamp || null,
        newestReading: newestReading?.timestamp || null,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT - Update settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const currentSettings = readSettings();
    
    // Validate and merge settings
    const newSettings = {
      dbSaveInterval: body.dbSaveInterval ?? currentSettings.dbSaveInterval,
      updateRate: body.updateRate ?? currentSettings.updateRate,
      connectionTimeout: body.connectionTimeout ?? currentSettings.connectionTimeout,
      reconnectInterval: body.reconnectInterval ?? currentSettings.reconnectInterval,
      maxReconnectAttempts: body.maxReconnectAttempts ?? currentSettings.maxReconnectAttempts,
    };

    // Validate values
    if (newSettings.dbSaveInterval < 5000) {
      return NextResponse.json(
        { error: "Database save interval must be at least 5 seconds" },
        { status: 400 }
      );
    }

    if (newSettings.updateRate < 1000) {
      return NextResponse.json(
        { error: "Update rate must be at least 1 second" },
        { status: 400 }
      );
    }

    const success = writeSettings(newSettings);
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: newSettings,
      note: "Restart the monitor service for changes to take effect",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
