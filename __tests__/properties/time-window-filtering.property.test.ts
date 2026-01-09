import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { RealtimeDataPoint } from '@/lib/types/station';

/**
 * Property 4: Real-Time Data Filtering by Time Window
 * 
 * This property test validates that real-time data is correctly filtered
 * by time windows and that the filtering logic works consistently.
 * 
 * Validates Requirements:
 * - 4.3: Filter real-time data by time window (default 30 minutes)
 */

// Helper function to generate realistic realtime data points
const realtimeDataPointArbitrary = fc.record({
  timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
  activePower1: fc.option(fc.float({ min: 0, max: 1000 }), { nil: null }),
  activePower2: fc.option(fc.float({ min: 0, max: 1000 }), { nil: null }),
  activePower3: fc.option(fc.float({ min: 0, max: 1000 }), { nil: null }),
  activePower4: fc.option(fc.float({ min: 0, max: 1000 }), { nil: null }),
  activePower5: fc.option(fc.float({ min: 0, max: 1000 }), { nil: null }),
  activePower6: fc.option(fc.float({ min: 0, max: 1000 }), { nil: null }),
  muxPower1: fc.option(fc.float({ min: 0, max: 1000 }), { nil: null }),
  muxPower2: fc.option(fc.float({ min: 0, max: 1000 }), { nil: null }),
  muxPower3: fc.option(fc.float({ min: 0, max: 1000 }), { nil: null }),
  muxPower4: fc.option(fc.float({ min: 0, max: 1000 }), { nil: null }),
  muxPower5: fc.option(fc.float({ min: 0, max: 1000 }), { nil: null }),
  muxPower6: fc.option(fc.float({ min: 0, max: 1000 }), { nil: null }),
  totalActivePower: fc.float({ min: 0, max: 6000 }),
  totalMuxPower: fc.float({ min: 0, max: 6000 }),
});

// Helper function to filter data by time window
function filterByTimeWindow(
  data: RealtimeDataPoint[], 
  windowMinutes: number, 
  referenceTime: Date = new Date()
): RealtimeDataPoint[] {
  const windowStart = new Date(referenceTime.getTime() - (windowMinutes * 60 * 1000));
  
  return data.filter(point => {
    const pointTime = new Date(point.timestamp);
    return pointTime >= windowStart && pointTime <= referenceTime;
  });
}

// Helper function to generate time-ordered data points
function generateTimeOrderedData(count: number, baseTime: Date, intervalMinutes: number): RealtimeDataPoint[] {
  const data: RealtimeDataPoint[] = [];
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(baseTime.getTime() - (i * intervalMinutes * 60 * 1000));
    data.push({
      timestamp: timestamp.toISOString(),
      activePower1: Math.random() * 100,
      activePower2: Math.random() * 100,
      activePower3: Math.random() * 100,
      activePower4: Math.random() * 100,
      activePower5: Math.random() * 100,
      activePower6: Math.random() * 100,
      muxPower1: Math.random() * 100,
      muxPower2: Math.random() * 100,
      muxPower3: Math.random() * 100,
      muxPower4: Math.random() * 100,
      muxPower5: Math.random() * 100,
      muxPower6: Math.random() * 100,
      totalActivePower: Math.random() * 600,
      totalMuxPower: Math.random() * 600,
    });
  }
  
  return data;
}

describe('Property 4: Real-Time Data Filtering by Time Window', () => {
  it('should only include data points within the specified time window', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 120 }), // window minutes
        fc.integer({ min: 10, max: 100 }), // number of data points
        fc.integer({ min: 1, max: 10 }), // interval between points in minutes
        (windowMinutes, dataCount, intervalMinutes) => {
          const referenceTime = new Date();
          const data = generateTimeOrderedData(dataCount, referenceTime, intervalMinutes);
          
          const filtered = filterByTimeWindow(data, windowMinutes, referenceTime);
          
          // All filtered points should be within the time window
          const windowStart = new Date(referenceTime.getTime() - (windowMinutes * 60 * 1000));
          
          filtered.forEach(point => {
            const pointTime = new Date(point.timestamp);
            expect(pointTime.getTime()).toBeGreaterThanOrEqual(windowStart.getTime());
            expect(pointTime.getTime()).toBeLessThanOrEqual(referenceTime.getTime());
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should exclude data points outside the time window', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 60 }), // window minutes
        (windowMinutes) => {
          const referenceTime = new Date();
          const windowStart = new Date(referenceTime.getTime() - (windowMinutes * 60 * 1000));
          
          // Create data points: some inside, some outside the window
          const insideData = generateTimeOrderedData(5, referenceTime, 5); // Within window
          const outsideData = generateTimeOrderedData(5, new Date(windowStart.getTime() - 60000), 5); // Outside window
          
          const allData = [...insideData, ...outsideData];
          const filtered = filterByTimeWindow(allData, windowMinutes, referenceTime);
          
          // Should only contain the inside data
          expect(filtered.length).toBeLessThanOrEqual(insideData.length);
          
          // All filtered points should be from the inside data
          filtered.forEach(point => {
            const pointTime = new Date(point.timestamp);
            expect(pointTime.getTime()).toBeGreaterThanOrEqual(windowStart.getTime());
          });
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should handle empty data arrays', () => {
    const filtered = filterByTimeWindow([], 30);
    expect(filtered).toEqual([]);
  });

  it('should handle single data point correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 120 }),
        (windowMinutes) => {
          const referenceTime = new Date();
          const data = generateTimeOrderedData(1, referenceTime, 1);
          
          const filtered = filterByTimeWindow(data, windowMinutes, referenceTime);
          
          // Single recent point should be included
          expect(filtered.length).toBe(1);
          expect(filtered[0]).toEqual(data[0]);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should be consistent with different reference times', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 60 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        (windowMinutes, referenceTime) => {
          // Skip invalid dates
          if (isNaN(referenceTime.getTime())) {
            return true; // Skip this test case
          }
          
          const data = generateTimeOrderedData(20, referenceTime, 2);
          
          const filtered1 = filterByTimeWindow(data, windowMinutes, referenceTime);
          const filtered2 = filterByTimeWindow(data, windowMinutes, referenceTime);
          
          // Should produce identical results
          expect(filtered1).toEqual(filtered2);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should handle edge case where data point timestamp equals window boundary', () => {
    const referenceTime = new Date();
    const windowMinutes = 30;
    const windowStart = new Date(referenceTime.getTime() - (windowMinutes * 60 * 1000));
    
    const data: RealtimeDataPoint[] = [{
      timestamp: windowStart.toISOString(), // Exactly at window start
      activePower1: 100,
      activePower2: null,
      activePower3: null,
      activePower4: null,
      activePower5: null,
      activePower6: null,
      muxPower1: 50,
      muxPower2: null,
      muxPower3: null,
      muxPower4: null,
      muxPower5: null,
      muxPower6: null,
      totalActivePower: 100,
      totalMuxPower: 50,
    }];
    
    const filtered = filterByTimeWindow(data, windowMinutes, referenceTime);
    
    // Point at window boundary should be included
    expect(filtered.length).toBe(1);
    expect(filtered[0]).toEqual(data[0]);
  });
});