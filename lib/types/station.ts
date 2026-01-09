// Station Detail Page Types

export type TimePeriod = 'day' | 'week' | 'month' | 'year';

export type StationStatus = 'active' | 'stale' | 'offline';

export interface PowerReading {
  id: string;
  stationId: string;
  timestamp: string;
  activePower1: number | null;
  activePower2: number | null;
  activePower3: number | null;
  activePower4: number | null;
  activePower5: number | null;
  activePower6: number | null;
  muxPower1: number | null;
  muxPower2: number | null;
  muxPower3: number | null;
  muxPower4: number | null;
  muxPower5: number | null;
  muxPower6: number | null;
}

export interface StationInfo {
  id: string;
  name: string;
  ipAddress: string | null;
  scene: string | null;
  status: StationStatus;
  latestReading: PowerReading | null;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface AggregatedDataPoint {
  label: string;
  timestamp: string;
  activePowerSum: number;
  activePowerAvg: number;
  muxPowerSum: number;
  muxPowerAvg: number;
  readingCount: number;
}

export interface RealtimeDataPoint {
  timestamp: string;
  activePower1: number | null;
  activePower2: number | null;
  activePower3: number | null;
  activePower4: number | null;
  activePower5: number | null;
  activePower6: number | null;
  muxPower1: number | null;
  muxPower2: number | null;
  muxPower3: number | null;
  muxPower4: number | null;
  muxPower5: number | null;
  muxPower6: number | null;
  totalActivePower: number;
  totalMuxPower: number;
}

// API Response Types
export interface StationDetailResponse {
  station: StationInfo;
  timestamp: string;
}

export interface HistoricalDataResponse {
  stationId: string;
  dateRange: {
    from: string;
    to: string;
  };
  timePeriod: TimePeriod;
  data: AggregatedDataPoint[];
  metadata: {
    totalReadings: number;
    aggregationMethod: 'sum' | 'average';
  };
}

export interface RealtimeDataResponse {
  stationId: string;
  readings: RealtimeDataPoint[];
  latestTimestamp: string;
}

export interface APIErrorResponse {
  error: string;
  code: string;
  details?: Record<string, string>;
}
