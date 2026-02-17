import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
    calculateConsumption,
    calculateBill,
    getStationTariff,
    resolveCustomerAlias,
    DEFAULT_BILLING_CONFIG,
} from "@/lib/billing-calculator";
import type { BillingPeriod } from "@/lib/types/billing";

const prisma = new PrismaClient();

const MUX_POWER_FIELDS = [
    'muxPower1', 'muxPower2', 'muxPower3',
    'muxPower4', 'muxPower5', 'muxPower6',
] as const;

const MODBUS_FIELDS = [
    'modbus1', 'modbus2', 'modbus3',
    'modbus4', 'modbus5', 'modbus6',
] as const;

export interface ChannelBilling {
    muxChannel: number;
    customerName: string;
    previousReadDate: string;
    previousMeterReading: number;
    latestReadDate: string;
    latestMeterReading: number;
    consumption: number;
    tariff: number;
    billAmount: number;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);

        const month = parseInt(searchParams.get("month") || "");
        const year = parseInt(searchParams.get("year") || "");

        if (!month || !year || month < 1 || month > 12) {
            return NextResponse.json(
                { error: "Valid month (1-12) and year are required" },
                { status: 400 }
            );
        }

        // Find the station with modbus config
        const station = await prisma.station.findUnique({
            where: { id },
            include: { modbusConfig: true },
        });

        if (!station) {
            return NextResponse.json(
                { error: "Station not found" },
                { status: 404 }
            );
        }

        // Convert BE year to Gregorian for date queries
        const gregorianYear = year > 2500 ? year - 543 : year;

        const startOfMonth = new Date(gregorianYear, month - 1, 1);
        const endOfMonth = new Date(gregorianYear, month, 0, 23, 59, 59, 999);

        const period: BillingPeriod = { month, year };
        const tariff = getStationTariff(station.name);
        const channels: ChannelBilling[] = [];

        for (let ch = 0; ch < 6; ch++) {
            const muxField = MUX_POWER_FIELDS[ch];
            const modbusField = MODBUS_FIELDS[ch];
            const channelNum = ch + 1;

            // Get customer name from modbus config
            const modbusLabel = station.modbusConfig
                ? (station.modbusConfig[modbusField] as string | null)
                : null;

            if (!modbusLabel) continue;

            // Get earliest reading (PMR)
            const earliestReading = await prisma.powerReading.findFirst({
                where: {
                    stationId: station.id,
                    timestamp: { gte: startOfMonth, lte: endOfMonth },
                    [muxField]: { not: null },
                },
                select: {
                    timestamp: true,
                    muxPower1: true, muxPower2: true, muxPower3: true,
                    muxPower4: true, muxPower5: true, muxPower6: true,
                },
                orderBy: { timestamp: "asc" },
            });

            // Get latest reading (LMR)
            const latestReading = await prisma.powerReading.findFirst({
                where: {
                    stationId: station.id,
                    timestamp: { gte: startOfMonth, lte: endOfMonth },
                    [muxField]: { not: null },
                },
                select: {
                    timestamp: true,
                    muxPower1: true, muxPower2: true, muxPower3: true,
                    muxPower4: true, muxPower5: true, muxPower6: true,
                },
                orderBy: { timestamp: "desc" },
            });

            if (!earliestReading || !latestReading) continue;

            // Check if station uses Watts (scene is null) -> convert to kWh
            const isWattUnit = station.scene === null;
            const divisor = isWattUnit ? 1000 : 1;

            const pmr = ((earliestReading as Record<string, unknown>)[muxField] as number || 0) / divisor;
            const lmr = ((latestReading as Record<string, unknown>)[muxField] as number || 0) / divisor;

            if (pmr === lmr) continue;

            try {
                const consumption = calculateConsumption(pmr, lmr);
                const billAmount = calculateBill(consumption, tariff);
                const customerName = resolveCustomerAlias(modbusLabel);

                channels.push({
                    muxChannel: channelNum,
                    customerName,
                    previousReadDate: earliestReading.timestamp.toISOString(),
                    previousMeterReading: pmr,
                    latestReadDate: latestReading.timestamp.toISOString(),
                    latestMeterReading: lmr,
                    consumption,
                    tariff,
                    billAmount,
                });
            } catch (err) {
                console.warn(`Skipping ${station.name} MUX#${channelNum}: ${err}`);
                continue;
            }
        }

        // Calculate totals
        const subtotal = channels.reduce((s, c) => s + c.billAmount, 0);
        const vatAmount = Math.round(subtotal * DEFAULT_BILLING_CONFIG.vatRate * 100) / 100;
        const netTotal = Math.round((subtotal + vatAmount) * 100) / 100;

        return NextResponse.json({
            stationName: station.name,
            period,
            channels,
            totals: {
                subtotal,
                vatRate: DEFAULT_BILLING_CONFIG.vatRate,
                vatAmount,
                netTotal,
                totalConsumption: channels.reduce((s, c) => s + c.consumption, 0),
            },
            message: channels.length === 0
                ? "ไม่พบข้อมูลการอ่านค่ามิเตอร์ในช่วงเวลาที่เลือก"
                : undefined,
        });
    } catch (error) {
        console.error("Error calculating station billing:", error);
        return NextResponse.json(
            { error: "Failed to calculate station billing" },
            { status: 500 }
        );
    }
}
