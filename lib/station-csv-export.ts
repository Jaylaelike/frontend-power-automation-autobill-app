import { format } from "date-fns";
import type { 
  AggregatedDataPoint, 
  DateRange, 
  TimePeriod,
  StationInfo,
  RealtimeDataPoint,
  ModbusConfig
} from "@/lib/types/station";

interface StationCSVExportOptions {
  station: StationInfo;
  data: AggregatedDataPoint[];
  dateRange: DateRange;
  timePeriod: TimePeriod;
}

interface ActivePowerChannelAnalytics {
  channel: number;
  day: { min: number; max: number; avg: number; count: number; chartData: { label: string; value: number }[] };
  week: { min: number; max: number; avg: number; count: number; chartData: { label: string; value: number }[] };
  month: { min: number; max: number; avg: number; count: number; chartData: { label: string; value: number }[] };
  year: { min: number; max: number; avg: number; count: number; chartData: { label: string; value: number }[] };
}

export function exportStationDataToCSV({
  station,
  data,
  dateRange,
  timePeriod,
}: StationCSVExportOptions) {
  // Define CSV headers
  const headers = [
    'Period',
    'Timestamp',
    'Total Active Power (W)',
    'Average Active Power (W)',
    'Total MUX Power (kWh)',
    'Average MUX Power (kWh)',
    'Reading Count',
  ];

  // Convert data to CSV rows
  const rows = data.map(point => [
    point.label,
    format(new Date(point.timestamp), 'yyyy-MM-dd HH:mm:ss'),
    point.activePowerSum.toFixed(2),
    point.activePowerAvg.toFixed(2),
    point.muxPowerSum.toFixed(2),
    point.muxPowerAvg.toFixed(2),
    point.readingCount.toString(),
  ]);

  // Add metadata rows at the top
  const metadataRows = [
    ['Station Name', station.name],
    ['Station ID', station.id],
    ['IP Address', station.ipAddress || 'N/A'],
    ['Scene', station.scene || 'N/A'],
    ['Export Date', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
    ['Date Range', `${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}`],
    ['Time Period', timePeriod.toUpperCase()],
    ['Total Records', data.length.toString()],
    [], // Empty row separator
  ];

  // Combine metadata, headers, and data rows
  const csvContent = [
    ...metadataRows,
    headers,
    ...rows,
  ]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  // Generate filename
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const rangeStr = `${format(dateRange.from, 'yyyyMMdd')}-${format(dateRange.to, 'yyyyMMdd')}`;
  const filename = `${station.name.replace(/\s+/g, '_')}_${timePeriod}_${rangeStr}_${dateStr}.csv`;

  downloadCSV(csvContent, filename);
}

// Export Historical Bar Chart Data (Daily Power Data)
export function exportHistoricalDataToCSV({
  station,
  data,
  dateRange,
  timePeriod,
}: StationCSVExportOptions) {
  const periodLabel = timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1);
  
  // Define CSV headers
  const headers = [
    'Period',
    'Timestamp',
    'Total Active Power (W)',
    'Average Active Power (W)',
    'Total MUX Power (kWh)',
    'Average MUX Power (kWh)',
    'Reading Count',
  ];

  // Convert data to CSV rows
  const rows = data.map(point => [
    point.label,
    format(new Date(point.timestamp), 'yyyy-MM-dd HH:mm:ss'),
    point.activePowerSum.toFixed(2),
    point.activePowerAvg.toFixed(2),
    point.muxPowerSum.toFixed(2),
    point.muxPowerAvg.toFixed(2),
    point.readingCount.toString(),
  ]);

  // Add metadata rows at the top
  const metadataRows = [
    ['Report Type', `${periodLabel} Power Data`],
    ['Station Name', station.name],
    ['Station ID', station.id],
    ['IP Address', station.ipAddress || 'N/A'],
    ['Scene', station.scene || 'N/A'],
    ['Export Date', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
    ['Date Range', `${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}`],
    ['Time Period', timePeriod.toUpperCase()],
    ['Total Records', data.length.toString()],
    [], // Empty row separator
  ];

  // Combine metadata, headers, and data rows
  const csvContent = [
    ...metadataRows,
    headers,
    ...rows,
  ]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  // Generate filename
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const rangeStr = `${format(dateRange.from, 'yyyyMMdd')}-${format(dateRange.to, 'yyyyMMdd')}`;
  const filename = `${station.name.replace(/\s+/g, '_')}_Historical_${timePeriod}_${rangeStr}_${dateStr}.csv`;

  downloadCSV(csvContent, filename);
}

// Get modbus channel name for display
function getModbusChannelName(index: number, modbusConfig?: ModbusConfig | null): string {
  if (!modbusConfig) return `Channel ${index}`;
  
  const modbusKey = `modbus${index}` as keyof ModbusConfig;
  const channelName = modbusConfig[modbusKey];
  
  if (channelName) {
    return channelName;
  }
  return `Channel ${index}`;
}

// Export Active Power Breakdown Data
interface ActivePowerExportOptions {
  stationName: string;
  stationId: string;
  analytics: ActivePowerChannelAnalytics[];
  selectedPeriod: 'day' | 'week' | 'month' | 'year';
  modbusConfig?: ModbusConfig | null;
}

export function exportActivePowerBreakdownToCSV({
  stationName,
  stationId,
  analytics,
  selectedPeriod,
  modbusConfig,
}: ActivePowerExportOptions) {
  const periodLabels = {
    day: 'Last 24 Hours',
    week: 'Last 7 Days',
    month: 'Last 30 Days',
    year: 'Last 12 Months',
  };

  // Metadata rows
  const metadataRows = [
    ['Report Type', 'Active Power Breakdown'],
    ['Station Name', stationName],
    ['Station ID', stationId],
    ['Export Date', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
    ['Time Period', periodLabels[selectedPeriod]],
    [], // Empty row separator
  ];

  // Summary section
  const summaryHeaders = [
    'Channel',
    'Channel Name',
    'Min (W)',
    'Max (W)',
    'Average (W)',
    'Reading Count',
  ];

  const summaryRows = analytics.map(channel => {
    const stats = channel[selectedPeriod];
    const channelName = getModbusChannelName(channel.channel, modbusConfig);
    return [
      `Active Power ${channel.channel}`,
      channelName,
      stats.min.toFixed(2),
      stats.max.toFixed(2),
      stats.avg.toFixed(2),
      stats.count.toString(),
    ];
  });

  // Detailed data section for each channel
  const detailedSections: string[][] = [
    [], // Empty row separator
    ['Detailed Historical Data'],
    [],
  ];

  analytics.forEach(channel => {
    const stats = channel[selectedPeriod];
    const channelName = getModbusChannelName(channel.channel, modbusConfig);
    
    detailedSections.push([`Active Power ${channel.channel} - ${channelName}`]);
    detailedSections.push(['Period', 'Power (W)']);
    
    stats.chartData.forEach(point => {
      detailedSections.push([point.label, point.value.toFixed(2)]);
    });
    
    detailedSections.push([]); // Empty row between channels
  });

  // Combine all sections
  const csvContent = [
    ...metadataRows,
    summaryHeaders,
    ...summaryRows,
    ...detailedSections,
  ]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  // Generate filename
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const filename = `${stationName.replace(/\s+/g, '_')}_ActivePower_${selectedPeriod}_${dateStr}.csv`;

  downloadCSV(csvContent, filename);
}

// Export MUX Power Breakdown Data (Realtime)
interface MuxPowerExportOptions {
  stationName: string;
  stationId: string;
  data: RealtimeDataPoint[];
  modbusConfig?: ModbusConfig | null;
}

export function exportMuxPowerBreakdownToCSV({
  stationName,
  stationId,
  data,
  modbusConfig,
}: MuxPowerExportOptions) {
  // Metadata rows
  const metadataRows = [
    ['Report Type', 'MUX Power Breakdown'],
    ['Station Name', stationName],
    ['Station ID', stationId],
    ['Export Date', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
    ['Data Points', data.length.toString()],
    ['Time Range', data.length > 0 ? `${format(new Date(data[0].timestamp), 'yyyy-MM-dd HH:mm:ss')} to ${format(new Date(data[data.length - 1].timestamp), 'yyyy-MM-dd HH:mm:ss')}` : 'N/A'],
    [], // Empty row separator
  ];

  // Headers for realtime data
  const headers = [
    'Timestamp',
    `MUX 1 - ${getModbusChannelName(1, modbusConfig)} (W)`,
    `MUX 2 - ${getModbusChannelName(2, modbusConfig)} (W)`,
    `MUX 3 - ${getModbusChannelName(3, modbusConfig)} (W)`,
    `MUX 4 - ${getModbusChannelName(4, modbusConfig)} (W)`,
    `MUX 5 - ${getModbusChannelName(5, modbusConfig)} (W)`,
    `MUX 6 - ${getModbusChannelName(6, modbusConfig)} (W)`,
    'Total MUX Power (W)',
  ];

  // Convert data to CSV rows
  const rows = data.map(point => [
    format(new Date(point.timestamp), 'yyyy-MM-dd HH:mm:ss'),
    (point.muxPower1 !== null ? point.muxPower1.toFixed(2) : '0'),
    (point.muxPower2 !== null ? point.muxPower2.toFixed(2) : '0'),
    (point.muxPower3 !== null ? point.muxPower3.toFixed(2) : '0'),
    (point.muxPower4 !== null ? point.muxPower4.toFixed(2) : '0'),
    (point.muxPower5 !== null ? point.muxPower5.toFixed(2) : '0'),
    (point.muxPower6 !== null ? point.muxPower6.toFixed(2) : '0'),
    point.totalMuxPower.toFixed(2),
  ]);

  // Add summary statistics
  const summaryRows: string[][] = [
    [], // Empty row separator
    ['Summary Statistics'],
    ['Channel', 'Latest Value (W)', 'Average (W)', 'Min (W)', 'Max (W)'],
  ];

  for (let i = 1; i <= 6; i++) {
    const channelKey = `muxPower${i}` as keyof RealtimeDataPoint;
    const values = data.map(point => point[channelKey] as number | null).filter(v => v !== null) as number[];
    
    if (values.length > 0) {
      const latest = values[values.length - 1];
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const channelName = getModbusChannelName(i, modbusConfig);
      
      summaryRows.push([
        `MUX ${i} - ${channelName}`,
        latest.toFixed(2),
        avg.toFixed(2),
        min.toFixed(2),
        max.toFixed(2),
      ]);
    }
  }

  // Combine all sections
  const csvContent = [
    ...metadataRows,
    headers,
    ...rows,
    ...summaryRows,
  ]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  // Generate filename
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const filename = `${stationName.replace(/\s+/g, '_')}_MUXPower_${dateStr}.csv`;

  downloadCSV(csvContent, filename);
}

// Helper function to download CSV
function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export MUX Power Breakdown Analytics Data
interface MuxPowerAnalyticsExportOptions {
  stationName: string;
  stationId: string;
  analytics: {
    channel: number;
    day: { min: number; max: number; avg: number; count: number };
    week: { min: number; max: number; avg: number; count: number };
    month: { min: number; max: number; avg: number; count: number };
    year: { min: number; max: number; avg: number; count: number };
  }[];
  selectedPeriod: 'day' | 'week' | 'month' | 'year';
  modbusConfig?: ModbusConfig | null;
}

export function exportMuxPowerAnalyticsToCSV({
  stationName,
  stationId,
  analytics,
  selectedPeriod,
  modbusConfig,
}: MuxPowerAnalyticsExportOptions) {
  const periodLabels = {
    day: 'Last 24 Hours',
    week: 'Last 7 Days',
    month: 'Last 30 Days',
    year: 'Last 12 Months',
  };

  // Metadata rows
  const metadataRows = [
    ['Report Type', 'MUX Power Breakdown Analytics'],
    ['Station Name', stationName],
    ['Station ID', stationId],
    ['Export Date', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
    ['Time Period', periodLabels[selectedPeriod]],
    [], // Empty row separator
  ];

  // Summary section
  const summaryHeaders = [
    'Channel',
    'Channel Name',
    'Min (W)',
    'Max (W)',
    'Average (W)',
    'Reading Count',
  ];

  const summaryRows = analytics.map(channel => {
    const stats = channel[selectedPeriod];
    const channelName = getModbusChannelName(channel.channel, modbusConfig);
    return [
      `MUX ${channel.channel}`,
      channelName,
      stats.min.toFixed(2),
      stats.max.toFixed(2),
      stats.avg.toFixed(2),
      stats.count.toString(),
    ];
  });

  // Combine all sections
  const csvContent = [
    ...metadataRows,
    summaryHeaders,
    ...summaryRows,
  ]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  // Generate filename
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const filename = `${stationName.replace(/\s+/g, '_')}_MUXPower_Analytics_${selectedPeriod}_${dateStr}.csv`;

  downloadCSV(csvContent, filename);
}
