const jsPDF = require('jspdf').jsPDF;
require('jspdf-autotable');
import { FontLoader } from './font-loader';

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

export async function generateStationPDF(stationData: PowerReading, title?: string): Promise<Uint8Array> {
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
  
  // Power readings table
  const tableData = [
    ['MUX Power 1', `${stationData.muxPower1.toLocaleString('th-TH', { minimumFractionDigits: 2 })} kWh`],
    ['MUX Power 2', `${stationData.muxPower2.toLocaleString('th-TH', { minimumFractionDigits: 2 })} kWh`],
    ['MUX Power 3', `${stationData.muxPower3.toLocaleString('th-TH', { minimumFractionDigits: 2 })} kWh`],
    ['MUX Power 4', `${stationData.muxPower4.toLocaleString('th-TH', { minimumFractionDigits: 2 })} kWh`],
    ['MUX Power 5', `${stationData.muxPower5.toLocaleString('th-TH', { minimumFractionDigits: 2 })} kWh`],
    ['MUX Power 6', `${stationData.muxPower6.toLocaleString('th-TH', { minimumFractionDigits: 2 })} kWh`],
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
  
  return doc.output('arraybuffer') as Uint8Array;
}