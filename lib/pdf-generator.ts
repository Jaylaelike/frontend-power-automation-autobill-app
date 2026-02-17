const jsPDF = require('jspdf').jsPDF;
require('jspdf-autotable');
import { FontLoader } from './font-loader';

import { StationBillingResponse } from './types/billing';
import { formatCurrency, formatKwh, getThaiMonthName } from './billing-calculator';

export interface PowerReading {
  stationName: string;
  lastUpdate: string;
  muxPower1: number;
  muxPower2: number;
  muxPower3: number;
  muxPower4: number;
  muxPower5: number;
  muxPower6: number;
  totalMuxPower: number;
  // Modbus channel labels (optional)
  modbusLabel1?: string | null;
  modbusLabel2?: string | null;
  modbusLabel3?: string | null;
  modbusLabel4?: string | null;
  modbusLabel5?: string | null;
  modbusLabel6?: string | null;
}

// Helper function to get modbus label with fallback
function getModbusLabel(index: number, modbusLabel?: string | null): string {
  if (modbusLabel && modbusLabel.trim()) {
    return `MUX ${index} - ${modbusLabel}`;
  }
  return `MUX Power ${index}`;
}

export async function generatePowerReadingsPDF(data: PowerReading[], title: string = 'รายงานค่าพลังงานไฟฟ้า'): Promise<Uint8Array> {
  console.log('Starting PDF generation for power readings, count:', data.length);
  const doc = new jsPDF();

  // Setup fonts with error handling
  try {
    console.log('Font status before setup:', FontLoader.getFontStatus());
    await FontLoader.setupFonts(doc);
    console.log('Fonts setup completed successfully for power readings PDF');

    // Verify fonts are available in the document
    const availableFonts = doc.getFontList();
    console.log('Available fonts in power readings PDF document:', Object.keys(availableFonts));
  } catch (error) {
    console.warn('Font setup failed for power readings PDF, continuing with default fonts:', error);
  }

  // Add title
  FontLoader.setFont(doc, 'bold');
  doc.setFontSize(16);
  doc.text(title, 14, 22);

  // Add generation date
  FontLoader.setFont(doc, 'normal');
  doc.setFontSize(10);
  doc.text(`สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}`, 14, 32);

  // Prepare table data
  const tableData = data.map(reading => [
    reading.stationName,
    reading.lastUpdate,
    reading.muxPower1.toFixed(2),
    reading.muxPower2.toFixed(2),
    reading.muxPower3.toFixed(2),
    reading.muxPower4.toFixed(2),
    reading.muxPower5.toFixed(2),
    reading.muxPower6.toFixed(2),
    reading.totalMuxPower.toFixed(2)
  ]);

  // Add table
  (doc as any).autoTable({
    head: [['ชื่อสถานี', 'อัปเดตล่าสุด', 'MUX Power 1', 'MUX Power 2', 'MUX Power 3', 'MUX Power 4', 'MUX Power 5', 'MUX Power 6', 'รวม MUX Power']],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      font: 'Sarabun',
      fontStyle: 'normal'
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      font: 'Sarabun',
      fontStyle: 'bold',
      fontSize: 10
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' }
    }
  });

  return doc.output('arraybuffer') as Uint8Array;
}

export async function generateStationPDF(stationData: PowerReading, billingData?: StationBillingResponse, title?: string): Promise<Uint8Array> {
  console.log('Starting PDF generation for station:', stationData.stationName);
  const doc = new jsPDF();

  // Setup fonts with error handling
  try {
    console.log('Font status before setup:', FontLoader.getFontStatus());
    await FontLoader.setupFonts(doc);
    console.log('Fonts setup completed successfully for station PDF');

    // Verify fonts are available in the document
    const availableFonts = doc.getFontList();
    console.log('Available fonts in station PDF document:', Object.keys(availableFonts));
  } catch (error) {
    console.warn('Font setup failed for station PDF, continuing with default fonts:', error);
  }

  // Add title
  FontLoader.setFont(doc, 'bold');
  doc.setFontSize(16);
  doc.text(title || `รายงานค่าพลังงานไฟฟ้า สถานี ${stationData.stationName}`, 14, 22);

  // Add generation date with precise timestamp
  FontLoader.setFont(doc, 'normal');
  doc.setFontSize(10);
  const generationTime = new Date();
  doc.text(`สร้างเมื่อ: ${generationTime.toLocaleString('th-TH')} (${generationTime.getTime()})`, 14, 32);

  // Station details
  FontLoader.setFont(doc, 'medium');
  doc.setFontSize(12);
  doc.text(`สถานี: ${stationData.stationName}`, 14, 50);
  doc.text(`อัปเดตล่าสุด: ${new Date(stationData.lastUpdate).toLocaleString('th-TH')}`, 14, 60);

  // Power readings table with modbus labels
  const tableData = [
    [getModbusLabel(1, stationData.modbusLabel1), `${stationData.muxPower1.toLocaleString('th-TH', { minimumFractionDigits: 2 })} kWh`],
    [getModbusLabel(2, stationData.modbusLabel2), `${stationData.muxPower2.toLocaleString('th-TH', { minimumFractionDigits: 2 })} kWh`],
    [getModbusLabel(3, stationData.modbusLabel3), `${stationData.muxPower3.toLocaleString('th-TH', { minimumFractionDigits: 2 })} kWh`],
    [getModbusLabel(4, stationData.modbusLabel4), `${stationData.muxPower4.toLocaleString('th-TH', { minimumFractionDigits: 2 })} kWh`],
    [getModbusLabel(5, stationData.modbusLabel5), `${stationData.muxPower5.toLocaleString('th-TH', { minimumFractionDigits: 2 })} kWh`],
    [getModbusLabel(6, stationData.modbusLabel6), `${stationData.muxPower6.toLocaleString('th-TH', { minimumFractionDigits: 2 })} kWh`],
    ['รวม MUX Power', `${stationData.totalMuxPower.toLocaleString('th-TH', { minimumFractionDigits: 2 })} kWh`]
  ];

  (doc as any).autoTable({
    head: [['ชื่อลูกค้า', 'ค่าที่อ่านได้']],
    body: tableData,
    startY: 70,
    styles: {
      fontSize: 11,
      cellPadding: 4,
      font: 'Sarabun',
      fontStyle: 'normal'
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      font: 'Sarabun',
      fontStyle: 'bold',
      fontSize: 12
    },
    columnStyles: {
      1: { halign: 'right' }
    }
  });

  // Add Billing Section if data exists
  if (billingData) {
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    let currentY = finalY + 20;

    // Check for page break
    if (currentY > 250) {
      doc.addPage();
      currentY = 40;
    }

    FontLoader.setFont(doc, 'bold');
    doc.setFontSize(14);
    doc.text(`ค่าไฟฟ้าประจำเดือน ${getThaiMonthName(billingData.period.month)} พ.ศ. ${billingData.period.year}`, 14, currentY);

    currentY += 8;
    FontLoader.setFont(doc, 'normal');
    doc.setFontSize(10);
    doc.text('คำนวณค่าใช้บริการกระแสไฟฟ้า แยกตามช่อง MUX', 14, currentY);

    const billingRows = billingData.channels.map(ch => [
      `MUX ${ch.muxChannel} - ${ch.customerName}`,
      `${formatKwh(ch.previousMeterReading)}`,
      `${formatKwh(ch.latestMeterReading)}`,
      `${formatKwh(ch.consumption)}`,
      `${formatCurrency(ch.billAmount)}`
    ]);

    // Add totals rows
    billingRows.push([
      'รวมค่าบริการพลังงานไฟฟ้า',
      '',
      '',
      `${formatKwh(billingData.totals.totalConsumption)}`,
      `${formatCurrency(billingData.totals.subtotal)}`
    ]);

    billingRows.push([
      'VAT 7%',
      '',
      '',
      '',
      `${formatCurrency(billingData.totals.vatAmount)}`
    ]);

    billingRows.push([
      'รวมยอดสุทธิ',
      '',
      '',
      '',
      `${formatCurrency(billingData.totals.netTotal)}`
    ]);

    (doc as any).autoTable({
      head: [['รายการ', 'PMR', 'LMR', 'หน่วยที่ใช้ (kWh)', 'จำนวนเงิน (บาท)']],
      body: billingRows,
      startY: currentY + 10,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        font: 'Sarabun',
        fontStyle: 'normal'
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        font: 'Sarabun',
        fontStyle: 'bold',
        fontSize: 10
      },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      },
      didParseCell: function (data: any) {
        // Style the totals rows specifically
        const rows = data.table.body;
        if (data.row.index >= rows.length - 3) {
          if (data.row.index === rows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [0, 128, 0]; // Green for Net Total
          } else {
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
  }

  return doc.output('arraybuffer') as Uint8Array;
}