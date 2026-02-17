/**
 * Billing PDF Generator
 *
 * Generates a PDF matching the official billing report format from:
 * "ตัวอย่างข้อมูลประกอบการเรียกเก็บเงินค่าไฟฟ้าของกรมประชาสัมพันธ์"
 *
 * Layout per page:
 *   - Title: "ค่าใช้บริการกระแสไฟฟ้า..."
 *   - Period: "ประจำเดือน ... พ.ศ. ..."
 *   - Table: ลำดับ | สถานี | ว/ด/ป ครั้งก่อน | PMR KWH | ว/ด/ป ครั้งหลังสุด | LMR KWH | หน่วย KWH | ค่าพลังงาน/KWH | จำนวนเงิน
 *   - Last page: summary footer (subtotal, VAT 7%, net total with Thai text)
 *   - Remarks section on last page
 */

const jsPDF = require("jspdf").jsPDF;
require("jspdf-autotable");
import { FontLoader } from "./font-loader";
import {
    formatCurrency,
    formatKwh,
    formatBillingPeriod,
} from "./billing-calculator";
import type { BillingSummary, BillingEntry } from "./types/billing";

// ─── Thai Number-to-Text Converter ──────────────────────────────────

const THAI_DIGITS = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const THAI_PLACES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

function numberToThaiText(amount: number): string {
    if (amount === 0) return "ศูนย์บาทถ้วน";

    const [intPart, decPart] = amount.toFixed(2).split(".");
    let result = convertIntToThai(parseInt(intPart)) + "บาท";

    const satang = parseInt(decPart);
    if (satang === 0) {
        result += "ถ้วน";
    } else {
        result += convertIntToThai(satang) + "สตางค์";
    }

    return result;
}

function convertIntToThai(n: number): string {
    if (n === 0) return "";
    if (n > 999999) {
        const millions = Math.floor(n / 1000000);
        const remainder = n % 1000000;
        return convertIntToThai(millions) + "ล้าน" + convertIntToThai(remainder);
    }

    const digits = String(n).split("").map(Number);
    const len = digits.length;
    let result = "";

    for (let i = 0; i < len; i++) {
        const d = digits[i];
        const place = len - i - 1;

        if (d === 0) continue;

        if (place === 1 && d === 1) {
            result += "สิบ";
        } else if (place === 1 && d === 2) {
            result += "ยี่สิบ";
        } else if (place === 0 && d === 1 && len > 1) {
            result += "เอ็ด";
        } else {
            result += THAI_DIGITS[d] + THAI_PLACES[place];
        }
    }

    return result;
}

// ─── PDF Layout Constants ───────────────────────────────────────────

const MARGIN_LEFT = 12;
const MARGIN_RIGHT = 12;
const TITLE_FONT_SIZE = 11;
const PERIOD_FONT_SIZE = 11;
const TABLE_FONT_SIZE = 8;
const FOOTER_FONT_SIZE = 9;
const REMARK_FONT_SIZE = 8;

// ─── Number & Date Formatting ───────────────────────────────────────

function formatDateTime(isoString: string): string {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year} , ${hours}:${minutes}:${seconds}`;
}

// ─── Main Export Function ───────────────────────────────────────────

export async function generateBillingPDF(summary: BillingSummary): Promise<ArrayBuffer> {
    // Use landscape A4 for wider table
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Setup Thai fonts
    try {
        await FontLoader.setupFonts(doc);
    } catch (err) {
        console.warn("Font setup failed, continuing with defaults:", err);
    }

    const periodText = formatBillingPeriod(summary.period);
    const titleText =
        "ค่าใช้บริการกระแสไฟฟ้าที่เกิดขึ้นจากการใช้บริการสิ่งอำนวยความสะดวกด้านกระจายเสียงหรือโทรทัศน์";
    const customerText = `สำหรับ ${summary.customerName}`;

    // Prepare table rows
    const tableBody = summary.entries.map((e) => [
        String(e.index),
        e.stationNameThai,
        formatDateTime(e.previousReadDate),
        formatNumber(e.previousMeterReading, 3),
        "KWH",
        formatDateTime(e.latestReadDate),
        formatNumber(e.latestMeterReading, 3),
        "KWH",
        formatNumber(e.consumption, 3),
        "KWH",
        `${e.tariff.toFixed(2)} บาท`,
        formatNumber(e.billAmount, 2),
        "บาท",
    ]);

    // Merged headers (two-row header)
    const head = [
        // Row 1: grouped headers
        [
            { content: "ลำดับ", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
            { content: "สถานี", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
            { content: "เลขที่อ่าน ครั้งก่อน", colSpan: 3, styles: { halign: "center" } },
            { content: "เลขที่อ่าน ครั้งหลังสุด", colSpan: 3, styles: { halign: "center" } },
            { content: "", colSpan: 2, styles: { halign: "center" } },
            { content: "ค่าพลังงาน KWH ละ", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
            { content: "คิดเป็นจำนวนเงินทั้งสิ้น", colSpan: 2, styles: { halign: "center" } },
        ],
        // Row 2: sub-headers
        [
            { content: "ว/ด/ป ที่อ่าน", styles: { halign: "center" } },
            { content: "ค่ากระแสไฟฟ้าที่จด", styles: { halign: "center" } },
            { content: "", styles: { halign: "center" } },
            { content: "ว/ด/ป ที่อ่าน", styles: { halign: "center" } },
            { content: "ค่ากระแสไฟฟ้าที่จด", styles: { halign: "center" } },
            { content: "", styles: { halign: "center" } },
            { content: "หน่วย KWH", styles: { halign: "center" } },
            { content: "ที่ใช้", styles: { halign: "center" } },
            { content: "", styles: { halign: "center" } },
            { content: "", styles: { halign: "center" } },
        ],
    ];

    // Use autoTable to generate the table
    (doc as any).autoTable({
        head,
        body: tableBody,
        startY: 50, // Explicit start Y below the headers
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, top: 50, bottom: 15 },
        styles: {
            fontSize: TABLE_FONT_SIZE,
            cellPadding: 1.5,
            font: "Sarabun",
            fontStyle: "normal",
            lineWidth: 0.2,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0],
            overflow: "linebreak",
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            font: "Sarabun",
            fontStyle: "bold",
            fontSize: TABLE_FONT_SIZE,
            lineWidth: 0.3,
            lineColor: [0, 0, 0],
        },
        bodyStyles: {
            lineWidth: 0.2,
            lineColor: [0, 0, 0],
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
        columnStyles: {
            0: { halign: "center", cellWidth: 12 },   // ลำดับ
            1: { halign: "left", cellWidth: 30 },      // สถานี
            2: { halign: "center", cellWidth: 22 },    // ว/ด/ป ครั้งก่อน
            3: { halign: "right", cellWidth: 28 },     // PMR
            4: { halign: "center", cellWidth: 10 },    // KWH
            5: { halign: "center", cellWidth: 22 },    // ว/ด/ป ครั้งหลังสุด
            6: { halign: "right", cellWidth: 28 },     // LMR
            7: { halign: "center", cellWidth: 10 },    // KWH
            8: { halign: "right", cellWidth: 22 },     // หน่วย KWH
            9: { halign: "center", cellWidth: 10 },    // KWH
            10: { halign: "center", cellWidth: 22 },   // ค่าพลังงาน
            11: { halign: "right", cellWidth: 28 },    // จำนวนเงิน
            12: { halign: "center", cellWidth: 10 },   // บาท
        },
        // Draw title and period on each page
        didDrawPage: (data: any) => {
            // Title
            FontLoader.setFont(doc, "bold");
            doc.setFontSize(TITLE_FONT_SIZE);
            doc.text(titleText, pageWidth / 2, 12, { align: "center" });

            // Customer name
            doc.text(customerText, pageWidth / 2, 18, { align: "center" });

            // Period
            FontLoader.setFont(doc, "bold");
            doc.setFontSize(PERIOD_FONT_SIZE);
            doc.text(periodText, pageWidth / 2, 25, { align: "center" });

            // Sub-heading
            FontLoader.setFont(doc, "normal");
            doc.setFontSize(7);
            const subText = "สถานีหลัก โครงการ ทีวีดิจิทัล";
            doc.text(subText, pageWidth / 2, 30, { align: "center" });

            // Page number
            doc.setFontSize(7);
            const pageNum = (doc as any).internal.getNumberOfPages();
            doc.text(
                `หน้า ${data.pageNumber} / ${pageNum}`,
                pageWidth - MARGIN_RIGHT,
                pageHeight - 5,
                { align: "right" }
            );
        },
        // After the last row, draw the summary footer
        didDrawCell: () => { },
    });

    // Draw the summary footer after the table
    const finalY = (doc as any).lastAutoTable.finalY;
    let y = finalY + 2;

    // Check if we need a new page for the summary
    if (y + 45 > pageHeight) {
        doc.addPage();
        y = 15;
    }

    // Summary table
    const summaryBody = [
        [
            { content: "", colSpan: 8, styles: { lineWidth: 0 } },
            { content: "รวม ค่าบริการพลังงานไฟฟ้า ทั้งสิ้น", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
            { content: formatNumber(summary.subtotal, 2), styles: { halign: "right", fontStyle: "bold" } },
            { content: "บาท", styles: { halign: "center" } },
        ],
        [
            { content: "", colSpan: 8, styles: { lineWidth: 0 } },
            { content: "VAT 7%", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
            { content: formatNumber(summary.vatAmount, 2), styles: { halign: "right", fontStyle: "bold" } },
            { content: "บาท", styles: { halign: "center" } },
        ],
        [
            { content: "", styles: { lineWidth: 0 } },
            { content: "จำนวนเงินสุทธิ", styles: { fontStyle: "bold" } },
            { content: numberToThaiText(summary.netTotal), colSpan: 6, styles: { fontStyle: "normal" } },
            { content: "รวมยอดสุทธิ", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
            { content: formatNumber(summary.netTotal, 2), styles: { halign: "right", fontStyle: "bold" } },
            { content: "บาท", styles: { halign: "center" } },
        ],
    ];

    (doc as any).autoTable({
        body: summaryBody,
        startY: y,
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        styles: {
            fontSize: FOOTER_FONT_SIZE,
            cellPadding: 2,
            font: "Sarabun",
            fontStyle: "normal",
            lineWidth: 0.2,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0],
        },
        theme: "plain",
    });

    // Remarks section
    const remarkY = (doc as any).lastAutoTable.finalY + 6;

    if (remarkY + 20 < pageHeight) {
        FontLoader.setFont(doc, "bold");
        doc.setFontSize(REMARK_FONT_SIZE + 1);
        doc.text("หมายเหตุ :", MARGIN_LEFT, remarkY);

        FontLoader.setFont(doc, "normal");
        doc.setFontSize(REMARK_FONT_SIZE);
        const remarks = [
            `1. อัตราค่าไฟฟ้า หน่วย (KWH) ละ 6.50 บาท ยกเว้นสถานีเกาะพะงัน (7.36 บาท)`,
            `2. เนื่องจากค่า FT ประจำเดือน พฤษภาคม - สิงหาคม 2568 หน่วยละ 0.1972 บาท ซึ่งต่ำกว่า 0.2477 บาท`,
            `   จึงใช้อัตราค่าใช้บริการไฟฟ้า 6.5 บาทต่อหน่วย`,
        ];
        remarks.forEach((line, i) => {
            doc.text(line, MARGIN_LEFT + 2, remarkY + 5 + i * 4);
        });
    }

    return doc.output("arraybuffer") as ArrayBuffer;
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatNumber(n: number, decimals: number): string {
    return n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}
