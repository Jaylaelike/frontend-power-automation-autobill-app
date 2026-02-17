import { describe, it, expect } from 'vitest';
import {
    calculateConsumption,
    calculateBill,
    calculatePendingBill,
    getStationTariff,
    calculateBillingSummary,
    createBillingEntry,
    createPendingBillEntry,
    formatCurrency,
    formatKwh,
    formatBillingPeriod,
    beToGregorian,
    gregorianToBe,
    getThaiMonthName,
    DEFAULT_BILLING_CONFIG,
    TARGET_STATIONS,
    MUX_CUSTOMER_MAPPINGS,
} from '@/lib/billing-calculator';
import type { BillingEntry, BillingPeriod } from '@/lib/types/billing';

// ─── Consumption Calculation (kWh = LMR - PMR) ──────────────────────

describe('calculateConsumption', () => {
    it('calculates Singburi station correctly: 306,680.918 - 303,889.156 = 2,791.762', () => {
        const result = calculateConsumption(303889.156, 306680.918);
        expect(result).toBeCloseTo(2791.762, 3);
    });

    it('calculates Sa Kaeo station correctly: 490,814.352 - 486,015.104 = 4,799.248', () => {
        const result = calculateConsumption(486015.104, 490814.352);
        expect(result).toBeCloseTo(4799.248, 3);
    });

    it('calculates Surin station correctly: 546,721.823 - 540,619.510 = 6,102.313', () => {
        const result = calculateConsumption(540619.510, 546721.823);
        expect(result).toBeCloseTo(6102.313, 3);
    });

    it('calculates Ko Pha-Ngan station correctly: 89,688.688 - 88,612.880 = 1,075.808', () => {
        const result = calculateConsumption(88612.880, 89688.688);
        expect(result).toBeCloseTo(1075.808, 3);
    });

    it('returns 0 for identical readings', () => {
        const result = calculateConsumption(100000, 100000);
        expect(result).toBe(0);
    });

    it('throws error when LMR < PMR (negative consumption)', () => {
        expect(() => calculateConsumption(200000, 100000)).toThrow('Invalid meter readings');
    });
});

// ─── Cost Calculation (BILL = kWh × ET) ─────────────────────────────

describe('calculateBill', () => {
    it('calculates Singburi bill correctly: 2,791.762 × 6.50 = 18,146.45', () => {
        const result = calculateBill(2791.762, 6.50);
        expect(result).toBeCloseTo(18146.45, 2);
    });

    it('calculates Ko Pha-Ngan bill correctly: 1,075.808 × 7.36 = 7,917.95', () => {
        const result = calculateBill(1075.808, 7.36);
        expect(result).toBeCloseTo(7917.95, 2);
    });

    it('calculates Khon Kaen bill correctly: 5,849.300 × 6.50 = 38,020.45', () => {
        const result = calculateBill(5849.300, 6.50);
        expect(result).toBeCloseTo(38020.45, 2);
    });

    it('returns 0 for zero consumption', () => {
        const result = calculateBill(0, 6.50);
        expect(result).toBe(0);
    });
});

// ─── Pending Bill/Refund (PBILL = kWh × (ET - UET)) ────────────────

describe('calculatePendingBill', () => {
    it('calculates refund when tariff decreases', () => {
        const result = calculatePendingBill(1000, 6.75, 6.50);
        expect(result).toBeCloseTo(250, 2);
    });

    it('calculates additional charge when tariff increases', () => {
        const result = calculatePendingBill(1000, 6.50, 6.75);
        expect(result).toBeCloseTo(-250, 2);
    });

    it('returns 0 when tariffs are equal', () => {
        const result = calculatePendingBill(1000, 6.50, 6.50);
        expect(result).toBe(0);
    });
});

// ─── Station Tariff Rules ───────────────────────────────────────────

describe('getStationTariff', () => {
    it('returns 7.36 for เกาะพะงัน', () => {
        expect(getStationTariff('เกาะพะงัน')).toBe(7.36);
    });

    it('returns 7.36 for KPN code', () => {
        expect(getStationTariff('KPN')).toBe(7.36);
    });

    it('returns 6.50 for สิงห์บุรี (standard rate)', () => {
        expect(getStationTariff('สิงห์บุรี')).toBe(6.50);
    });

    it('returns 6.50 for ขอนแก่น (standard rate)', () => {
        expect(getStationTariff('ขอนแก่น')).toBe(6.50);
    });

    it('returns 6.50 for สุโขทัย (standard rate)', () => {
        expect(getStationTariff('สุโขทัย')).toBe(6.50);
    });

    it('returns custom default tariff from config', () => {
        const config = { ...DEFAULT_BILLING_CONFIG, defaultTariff: 7.00 };
        expect(getStationTariff('สิงห์บุรี', config)).toBe(7.00);
    });
});

// ─── VAT & Summary Calculation ──────────────────────────────────────

describe('calculateBillingSummary', () => {
    const sampleEntries: BillingEntry[] = [
        {
            index: 1, stationName: 'Singburi', stationNameThai: 'สิงห์บุรี', stationCode: 'SBR',
            previousReadDate: '25 ธ.ค. 68', previousMeterReading: 303889.156,
            latestReadDate: '29 ม.ค. 69', latestMeterReading: 306680.918,
            consumption: 2791.762, tariff: 6.50, billAmount: 18146.45,
        },
    ];

    it('calculates subtotal correctly', () => {
        const period: BillingPeriod = { month: 1, year: 2569 };
        const summary = calculateBillingSummary(sampleEntries, period);
        expect(summary.subtotal).toBeCloseTo(18146.45, 2);
    });

    it('calculates VAT at 7%', () => {
        const period: BillingPeriod = { month: 1, year: 2569 };
        const summary = calculateBillingSummary(sampleEntries, period);
        expect(summary.vatAmount).toBeCloseTo(18146.45 * 0.07, 2);
    });

    it('calculates net total = subtotal + VAT', () => {
        const period: BillingPeriod = { month: 1, year: 2569 };
        const summary = calculateBillingSummary(sampleEntries, period);
        expect(summary.netTotal).toBeCloseTo(18146.45 + 18146.45 * 0.07, 2);
    });

    it('verifies report totals: subtotal=484,474.22, VAT=33,913.20, net=518,387.42', () => {
        // Create entries matching the report total
        const entries: BillingEntry[] = [{
            index: 1, stationName: 'All', stationNameThai: 'ทั้งหมด', stationCode: 'ALL',
            previousReadDate: '', previousMeterReading: 0,
            latestReadDate: '', latestMeterReading: 0,
            consumption: 0, tariff: 6.50, billAmount: 484474.22,
        }];
        const period: BillingPeriod = { month: 1, year: 2569 };
        const summary = calculateBillingSummary(entries, period);
        expect(summary.subtotal).toBeCloseTo(484474.22, 2);
        expect(summary.vatAmount).toBeCloseTo(33913.20, 2);
        expect(summary.netTotal).toBeCloseTo(518387.42, 2);
    });
});

// ─── createBillingEntry ─────────────────────────────────────────────

describe('createBillingEntry', () => {
    it('creates a complete entry for Singburi', () => {
        const entry = createBillingEntry({
            index: 1,
            stationName: 'Singburi',
            stationNameThai: 'สิงห์บุรี',
            stationCode: 'SBR',
            previousReadDate: '25 ธ.ค. 68',
            previousMeterReading: 303889.156,
            latestReadDate: '29 ม.ค. 69',
            latestMeterReading: 306680.918,
        });

        expect(entry.consumption).toBeCloseTo(2791.762, 3);
        expect(entry.tariff).toBe(6.50);
        expect(entry.billAmount).toBeCloseTo(18146.45, 2);
    });

    it('creates entry with special tariff for Ko Pha-Ngan', () => {
        const entry = createBillingEntry({
            index: 31,
            stationName: 'Ko Pha-Ngan',
            stationNameThai: 'เกาะพะงัน',
            stationCode: 'KPN',
            previousReadDate: '25 ธ.ค. 68',
            previousMeterReading: 88612.880,
            latestReadDate: '30 ม.ค. 69',
            latestMeterReading: 89688.688,
        });

        expect(entry.consumption).toBeCloseTo(1075.808, 3);
        expect(entry.tariff).toBe(7.36);
        expect(entry.billAmount).toBeCloseTo(7917.95, 2);
    });
});

// ─── createPendingBillEntry ─────────────────────────────────────────

describe('createPendingBillEntry', () => {
    it('creates pending bill entry correctly', () => {
        const entry = createPendingBillEntry('สิงห์บุรี', 2791.762, 6.75, 6.50);
        expect(entry.pendingAmount).toBeCloseTo(697.94, 2);
    });
});

// ─── Formatting Helpers ─────────────────────────────────────────────

describe('formatCurrency', () => {
    it('formats 18146.45 correctly', () => {
        const result = formatCurrency(18146.45);
        expect(result).toContain('18');
        expect(result).toContain('146');
        expect(result).toContain('45');
    });

    it('formats 518387.42 correctly', () => {
        const result = formatCurrency(518387.42);
        expect(result).toContain('518');
        expect(result).toContain('387');
        expect(result).toContain('42');
    });
});

describe('formatKwh', () => {
    it('formats 2791.762 with 3 decimal places', () => {
        const result = formatKwh(2791.762);
        expect(result).toContain('791');
        expect(result).toContain('762');
    });
});

describe('beToGregorian', () => {
    it('converts 2569 to 2026', () => {
        expect(beToGregorian(2569)).toBe(2026);
    });
});

describe('gregorianToBe', () => {
    it('converts 2026 to 2569', () => {
        expect(gregorianToBe(2026)).toBe(2569);
    });
});

describe('getThaiMonthName', () => {
    it('returns มกราคม for month 1', () => {
        expect(getThaiMonthName(1)).toBe('มกราคม');
    });

    it('returns ธันวาคม for month 12', () => {
        expect(getThaiMonthName(12)).toBe('ธันวาคม');
    });
});

describe('formatBillingPeriod', () => {
    it('formats period correctly in Thai', () => {
        const period: BillingPeriod = { month: 1, year: 2569 };
        const result = formatBillingPeriod(period);
        expect(result).toBe('ประจำเดือน มกราคม พ.ศ. 2569');
    });
});

// ─── Constants ──────────────────────────────────────────────────────

describe('TARGET_STATIONS', () => {
    it('contains 8 target stations', () => {
        expect(TARGET_STATIONS).toHaveLength(8);
    });

    it('includes KPN with special tariff note', () => {
        const kpn = TARGET_STATIONS.find(s => s.code === 'KPN');
        expect(kpn).toBeDefined();
        expect(kpn!.thaiName).toBe('เกาะพะงัน');
        expect(kpn!.note).toContain('7.36');
    });
});

describe('MUX_CUSTOMER_MAPPINGS', () => {
    it('contains 11 mappings', () => {
        expect(MUX_CUSTOMER_MAPPINGS).toHaveLength(11);
    });

    it('maps PRD1 to MUX#1', () => {
        const prd1 = MUX_CUSTOMER_MAPPINGS.find(m => m.systemVariable === 'PRD1');
        expect(prd1).toBeDefined();
        expect(prd1!.muxChannel).toBe(1);
    });

    it('maps MCOT3 to MUX#3', () => {
        const mcot = MUX_CUSTOMER_MAPPINGS.find(m => m.systemVariable === 'MCOT3');
        expect(mcot).toBeDefined();
        expect(mcot!.muxChannel).toBe(3);
    });
});
