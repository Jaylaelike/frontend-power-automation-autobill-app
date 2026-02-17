/**
 * Electricity Billing Calculator
 * 
 * Pure calculation functions for electricity billing based on:
 * - Electricity_Billing_Calculate.md
 * - Electricity_Billing_Calculate_update.md
 * 
 * Formulas:
 *   kWh  = LMR - PMR
 *   BILL = kWh × ET
 *   PBILL = kWh × (ET - UET)
 *   VAT  = subtotal × 0.07
 *   Net  = subtotal + VAT
 */

import type {
    BillingEntry,
    BillingSummary,
    BillingConfig,
    BillingPeriod,
    TargetStation,
    MuxCustomerMapping,
    PendingBillEntry,
} from './types/billing';

// ─── Default Configuration ───────────────────────────────────────────

export const DEFAULT_BILLING_CONFIG: BillingConfig = {
    defaultTariff: 6.50,
    specialTariffs: {
        'เกาะพะงัน': 7.36,
        'KPN': 7.36,
    },
    vatRate: 0.07,
    customerName: 'กรมประชาสัมพันธ์ โครงข่ายที่ 1',
};

// ─── Target Stations ─────────────────────────────────────────────────

export const TARGET_STATIONS: TargetStation[] = [
    { code: 'SBR', systemCode: 'SBR', englishName: 'Singburi', thaiName: 'สิงห์บุรี' },
    { code: 'KPN', systemCode: 'KPN', englishName: 'Ko Pha-Ngan', thaiName: 'เกาะพะงัน', note: 'Special tariff 7.36 THB' },
    { code: 'PKT', systemCode: 'PKT', englishName: 'Phuket', thaiName: 'ภูเก็ต' },
    { code: 'SKT', systemCode: 'SKT', englishName: 'Sukhothai', thaiName: 'สุโขทัย' },
    { code: 'KKN', systemCode: 'KKN', englishName: 'Khon Kaen', thaiName: 'ขอนแก่น' },
    { code: 'LEI', systemCode: 'LE', englishName: 'Loei', thaiName: 'เลย', note: 'System PDF uses code "LE"' },
    { code: 'PTO', systemCode: 'PTO', englishName: 'Phato', thaiName: 'พะโต๊ะ' },
    { code: 'SSK', systemCode: 'SSK', englishName: 'Samut Songkhram', thaiName: 'สมุทรสงคราม' },
];

// ─── Customer / MUX Channel Mapping ─────────────────────────────────

export const MUX_CUSTOMER_MAPPINGS: MuxCustomerMapping[] = [
    { userAlias: 'ART', systemVariable: 'AERO', description: 'Aero (Customer)', group: 'Customer' },
    { userAlias: 'PRD1', systemVariable: 'PRD1', muxChannel: 1, description: 'MUX#1 (กรมประชาสัมพันธ์)', group: 'MUX' },
    { userAlias: 'RTA5', systemVariable: 'RTA2', muxChannel: 2, description: 'MUX#2 (ทบ.5 โครงข่าย 2)', group: 'MUX' },
    { userAlias: 'MCOT3', systemVariable: 'MCOT3', muxChannel: 3, description: 'MUX#3 (อสมท.)', group: 'MUX' },
    { userAlias: 'TPBS4', systemVariable: 'TPBS4', muxChannel: 4, description: 'MUX#4 (Thai PBS)', group: 'MUX' },
    { userAlias: 'RTA5', systemVariable: 'RTA5', muxChannel: 5, description: 'MUX#5 (ทบ.5 โครงข่าย 5)', group: 'MUX' },
    { userAlias: 'DINDIN', systemVariable: 'DIN', description: 'Radio/Studio Group', group: 'Radio' },
    { userAlias: 'STL', systemVariable: 'STL', description: 'Radio/Studio Group', group: 'Radio' },
    { userAlias: 'NANA', systemVariable: 'NAN', description: 'Radio/Studio Group', group: 'Radio' },
    { userAlias: 'LTN', systemVariable: 'LTN', description: 'Looktoong (Radio)', group: 'Radio' },
    { userAlias: 'BFKT', systemVariable: 'BFKT', description: 'Customer Group', group: 'Customer' },
];

// ─── Customer Name Alias Lookup ─────────────────────────────────────
// Maps system/modbus names from StationModbus to display aliases

export const CUSTOMER_NAME_ALIASES: Record<string, string> = {
    'AERO': 'ART', 'ART': 'ART',
    'PRD1': 'PRD', 'PRD': 'PRD',
    'MCOT3': 'MCOT', 'MCOT': 'MCOT',
    'TPBS4': 'TPBS', 'TPBS': 'TPBS',
    'RTA5': 'TV5', 'RTA2': 'TV5', 'TV5': 'TV5',
    'NT': 'NT',
    'DINDIN': 'DIN', 'DIN': 'DIN',
    'STL': 'RADIO LINE',
    'NANA': 'NANA STUDIO', 'NAN': 'NANA STUDIO',
    'LTN': 'LOOKTOONG',
    'BFKT': 'BFKT',
};

/**
 * Resolve a modbus label to its customer display alias.
 * Falls back to the original label if no alias is found.
 */
export function resolveCustomerAlias(modbusLabel: string | null | undefined): string {
    if (!modbusLabel) return '';
    const trimmed = modbusLabel.trim().toUpperCase();
    return CUSTOMER_NAME_ALIASES[trimmed] || modbusLabel.trim();
}

// ─── Calculation Functions ───────────────────────────────────────────

/**
 * Calculate energy consumption from meter readings.
 * Formula: kWh = LMR - PMR
 */
export function calculateConsumption(pmr: number, lmr: number): number {
    if (lmr < pmr) {
        throw new Error(`Invalid meter readings: LMR (${lmr}) cannot be less than PMR (${pmr})`);
    }
    return roundTo3(lmr - pmr);
}

/**
 * Calculate the bill amount from consumption and tariff.
 * Formula: BILL = kWh × ET
 */
export function calculateBill(kwh: number, tariff: number): number {
    return roundTo2(kwh * tariff);
}

/**
 * Calculate pending bill/refund when tariff changes retroactively.
 * Formula: PBILL = kWh × (ET - UET)
 */
export function calculatePendingBill(kwh: number, currentTariff: number, updatedTariff: number): number {
    return roundTo2(kwh * (currentTariff - updatedTariff));
}

/**
 * Get the applicable tariff for a station.
 * Returns special tariff if station is in the special list, otherwise default.
 */
export function getStationTariff(stationName: string, config: BillingConfig = DEFAULT_BILLING_CONFIG): number {
    // Check by Thai name or code
    for (const [key, rate] of Object.entries(config.specialTariffs)) {
        if (stationName.includes(key) || stationName === key) {
            return rate;
        }
    }
    return config.defaultTariff;
}

/**
 * Calculate the complete billing summary from a list of entries.
 */
export function calculateBillingSummary(
    entries: BillingEntry[],
    period: BillingPeriod,
    config: BillingConfig = DEFAULT_BILLING_CONFIG
): BillingSummary {
    const subtotal = roundTo2(entries.reduce((sum, e) => sum + e.billAmount, 0));
    const vatAmount = roundTo2(subtotal * config.vatRate);
    const netTotal = roundTo2(subtotal + vatAmount);

    return {
        entries,
        subtotal,
        vatRate: config.vatRate,
        vatAmount,
        netTotal,
        period,
        customerName: config.customerName,
    };
}

/**
 * Create a billing entry from raw meter data.
 */
export function createBillingEntry(params: {
    index: number;
    stationName: string;
    stationNameThai: string;
    stationCode: string;
    previousReadDate: string;
    previousMeterReading: number;
    latestReadDate: string;
    latestMeterReading: number;
    config?: BillingConfig;
}): BillingEntry {
    const config = params.config || DEFAULT_BILLING_CONFIG;
    const tariff = getStationTariff(params.stationNameThai, config);
    const consumption = calculateConsumption(params.previousMeterReading, params.latestMeterReading);
    const billAmount = calculateBill(consumption, tariff);

    return {
        index: params.index,
        stationName: params.stationName,
        stationNameThai: params.stationNameThai,
        stationCode: params.stationCode,
        previousReadDate: params.previousReadDate,
        previousMeterReading: params.previousMeterReading,
        latestReadDate: params.latestReadDate,
        latestMeterReading: params.latestMeterReading,
        consumption,
        tariff,
        billAmount,
    };
}

/**
 * Create a pending bill entry for FT rate adjustments.
 */
export function createPendingBillEntry(
    stationName: string,
    consumption: number,
    currentTariff: number,
    updatedTariff: number
): PendingBillEntry {
    return {
        stationName,
        consumption,
        currentTariff,
        updatedTariff,
        pendingAmount: calculatePendingBill(consumption, currentTariff, updatedTariff),
    };
}

// ─── Formatting Helpers ──────────────────────────────────────────────

/**
 * Format a number as Thai Baht currency string.
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format kWh consumption value with 3 decimal places.
 */
export function formatKwh(kwh: number): string {
    return new Intl.NumberFormat('th-TH', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    }).format(kwh);
}

/**
 * Convert Buddhist Era year to Gregorian.
 */
export function beToGregorian(beYear: number): number {
    return beYear - 543;
}

/**
 * Convert Gregorian year to Buddhist Era.
 */
export function gregorianToBe(gregorianYear: number): number {
    return gregorianYear + 543;
}

/**
 * Get Thai month name.
 */
export function getThaiMonthName(month: number): string {
    const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
        'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
        'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
    ];
    return months[month - 1] || '';
}

/**
 * Format the billing period as Thai text.
 * e.g., "ประจำเดือน มกราคม พ.ศ. 2569"
 */
export function formatBillingPeriod(period: BillingPeriod): string {
    return `ประจำเดือน ${getThaiMonthName(period.month)} พ.ศ. ${period.year}`;
}

// ─── Internal Helpers ────────────────────────────────────────────────

function roundTo2(n: number): number {
    return Math.round(n * 100) / 100;
}

function roundTo3(n: number): number {
    return Math.round(n * 1000) / 1000;
}
