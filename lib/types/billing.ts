// Electricity Billing Calculation Types

export interface BillingPeriod {
    month: number; // 1-12
    year: number;  // Buddhist Era (e.g., 2569)
}

export interface BillingEntry {
    index: number;           // ลำดับ
    stationName: string;     // สถานี
    stationNameThai: string; // Thai name for display
    stationCode: string;     // System code (SBR, KPN, etc.)
    customerName?: string;   // Customer alias (e.g. "PRD", "MCOT")
    muxChannel?: number;     // MUX channel number (1-6)
    previousReadDate: string;   // ว/ด/ป ที่อ่าน ครั้งก่อน
    previousMeterReading: number; // PMR - เลขที่อ่าน ครั้งก่อน
    latestReadDate: string;     // ว/ด/ป ที่อ่าน ครั้งหลังสุด
    latestMeterReading: number;   // LMR - เลขที่อ่าน ครั้งหลังสุด
    consumption: number;       // kWh = LMR - PMR
    tariff: number;            // ET - ค่าพลังงาน KWH ละ (THB)
    billAmount: number;        // BILL = kWh * ET
}

export interface BillingSummary {
    entries: BillingEntry[];
    subtotal: number;      // รวมค่าบริการพลังงานไฟฟ้า ทั้งสิ้น
    vatRate: number;        // VAT rate (0.07 = 7%)
    vatAmount: number;      // VAT 7%
    netTotal: number;       // รวมยอดสุทธิ
    period: BillingPeriod;
    customerName: string;   // e.g., "กรมประชาสัมพันธ์ โครงข่ายที่ 1"
}

export interface BillingConfig {
    defaultTariff: number;    // Standard rate (6.50 THB)
    specialTariffs: Record<string, number>; // Station-specific rates (e.g., KPN: 7.36)
    vatRate: number;          // VAT rate (0.07)
    customerName: string;     // Billing entity name
}

// Target stations from the billing system
export interface TargetStation {
    code: string;        // User code (SBR, KPN, etc.)
    systemCode: string;  // System code from PDF
    englishName: string;
    thaiName: string;
    note?: string;
}

// Customer/MUX channel mapping
export interface MuxCustomerMapping {
    userAlias: string;      // User alias (ART, PRD1, etc.)
    systemVariable: string; // System variable (AERO, PRD1, etc.)
    muxChannel?: number;    // MUX channel number (1-6) if applicable
    description: string;    // Description
    group?: string;         // Group category
}

// Pending Bill / Refund for FT rate adjustments
export interface PendingBillEntry {
    stationName: string;
    consumption: number;      // kWh
    currentTariff: number;    // ET
    updatedTariff: number;    // UET
    pendingAmount: number;    // PBILL = kWh * (ET - UET)
}

// API Request/Response types
export interface BillingCalculateRequest {
    month: number;
    year: number;
    stationIds?: string[];
    tariffOverride?: number;
}

export interface BillingCalculateResponse {
    summary: BillingSummary;
    generatedAt: string;
}
