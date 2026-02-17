import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
    calculateConsumption,
    calculateBill,
    calculateBillingSummary,
    getStationTariff,
    resolveCustomerAlias,
    DEFAULT_BILLING_CONFIG,
} from "@/lib/billing-calculator";
import type { BillingEntry, BillingPeriod } from "@/lib/types/billing";

const prisma = new PrismaClient();

// MUX power field keys for iterating channels 1-6
const MUX_POWER_FIELDS = [
    'muxPower1', 'muxPower2', 'muxPower3',
    'muxPower4', 'muxPower5', 'muxPower6',
] as const;

const MODBUS_FIELDS = [
    'modbus1', 'modbus2', 'modbus3',
    'modbus4', 'modbus5', 'modbus6',
] as const;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { month, year, tariffOverride } = body;

        if (!month || !year) {
            return NextResponse.json(
                { error: "Month and year are required" },
                { status: 400 }
            );
        }

        // Convert BE year to Gregorian for date queries
        const gregorianYear = year > 2500 ? year - 543 : year;

        // Define the billing period date range
        const startOfMonth = new Date(gregorianYear, month - 1, 1);
        const endOfMonth = new Date(gregorianYear, month, 0, 23, 59, 59, 999);

        // Fetch all stations with their modbus config
        const stations = await prisma.station.findMany({
            select: {
                id: true,
                name: true,
                scene: true,
                modbusConfig: true,
            },
            orderBy: { name: 'asc' },
        });

        if (stations.length === 0) {
            return NextResponse.json({
                summary: {
                    entries: [],
                    subtotal: 0,
                    vatRate: DEFAULT_BILLING_CONFIG.vatRate,
                    vatAmount: 0,
                    netTotal: 0,
                    period: { month, year } as BillingPeriod,
                    customerName: DEFAULT_BILLING_CONFIG.customerName,
                },
                generatedAt: new Date().toISOString(),
            });
        }

        // Build billing config with optional tariff override
        const config = tariffOverride
            ? { ...DEFAULT_BILLING_CONFIG, defaultTariff: tariffOverride }
            : DEFAULT_BILLING_CONFIG;

        const entries: BillingEntry[] = [];
        let index = 1;

        for (const station of stations) {
            // Iterate over each MUX channel (1-6)
            for (let ch = 0; ch < 6; ch++) {
                const muxField = MUX_POWER_FIELDS[ch];
                const modbusField = MODBUS_FIELDS[ch];
                const channelNum = ch + 1;

                // Get the modbus label for this channel (customer name)
                const modbusLabel = station.modbusConfig
                    ? (station.modbusConfig[modbusField] as string | null)
                    : null;

                // Skip channels with no modbus mapping (unused channel)
                if (!modbusLabel) continue;

                // Get earliest reading in the period (PMR)
                const earliestReading = await prisma.powerReading.findFirst({
                    where: {
                        stationId: station.id,
                        timestamp: {
                            gte: startOfMonth,
                            lte: endOfMonth,
                        },
                        [muxField]: { not: null },
                    },
                    select: {
                        timestamp: true,
                        muxPower1: true, muxPower2: true, muxPower3: true,
                        muxPower4: true, muxPower5: true, muxPower6: true,
                    },
                    orderBy: { timestamp: 'asc' },
                });

                // Get latest reading in the period (LMR)
                const latestReading = await prisma.powerReading.findFirst({
                    where: {
                        stationId: station.id,
                        timestamp: {
                            gte: startOfMonth,
                            lte: endOfMonth,
                        },
                        [muxField]: { not: null },
                    },
                    select: {
                        timestamp: true,
                        muxPower1: true, muxPower2: true, muxPower3: true,
                        muxPower4: true, muxPower5: true, muxPower6: true,
                    },
                    orderBy: { timestamp: 'desc' },
                });

                if (!earliestReading || !latestReading) continue;

                // Check if station uses Watts (scene is null) -> convert to kWh
                const isWattUnit = station.scene === null;
                const divisor = isWattUnit ? 1000 : 1;

                // muxPower values are stored in Wh (if scene=null) or kWh (otherwise)
                const pmr = ((earliestReading as Record<string, unknown>)[muxField] as number || 0) / divisor;
                const lmr = ((latestReading as Record<string, unknown>)[muxField] as number || 0) / divisor;

                // Skip if readings are identical (no consumption)
                if (pmr === lmr) continue;

                try {
                    const consumption = calculateConsumption(pmr, lmr);
                    const tariff = getStationTariff(station.name, config);
                    const billAmount = calculateBill(consumption, tariff);
                    const customerName = resolveCustomerAlias(modbusLabel);

                    entries.push({
                        index,
                        stationName: station.name,
                        stationNameThai: station.name,
                        stationCode: station.name,
                        customerName,
                        muxChannel: channelNum,
                        previousReadDate: earliestReading.timestamp.toISOString(),
                        previousMeterReading: pmr,
                        latestReadDate: latestReading.timestamp.toISOString(),
                        latestMeterReading: lmr,
                        consumption,
                        tariff,
                        billAmount,
                    });

                    index++;
                } catch (err) {
                    // Skip channels with invalid readings (e.g., negative consumption)
                    console.warn(`Skipping ${station.name} MUX#${channelNum}: ${err}`);
                    continue;
                }
            }
        }

        const period: BillingPeriod = { month, year };
        const summary = calculateBillingSummary(entries, period, config);

        return NextResponse.json({
            summary,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error calculating billing:", error);
        return NextResponse.json(
            { error: "Failed to calculate billing" },
            { status: 500 }
        );
    }
}
