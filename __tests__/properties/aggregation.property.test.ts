/**
 * Property Test: API Aggregation Correctness
 * Feature: station-detail-page, Property 7: API Aggregation Correctness
 * 
 * For any valid API request with date range and time period parameters, the API response
 * SHALL contain aggregated data where each data point's values are mathematically correct
 * aggregations of the underlying readings for that time interval.
 * 
 * Validates: Requirements 6.1, 6.2, 6.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { aggregateReadings } from '@/app/api/station/[id]/historical/route';

// Generate a mock power reading
const powerReadingArb = fc.record({
  timestamp: fc.integer({ 
    min: new Date('2024-01-01').getTime(), 
    max: new Date('2024-12-31').getTime() 
  }).map(ts => new Date(ts)),
  activePower1: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: null }),
  activePower2: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: null }),
  activePower3: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: null }),
  activePower4: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: null }),
  activePower5: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: null }),
  activePower6: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: null }),
  muxPower1: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: null }),
  muxPower2: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: null }),
  muxPower3: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: null }),
  muxPower4: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: null }),
  muxPower5: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: null }),
  muxPower6: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: null }),
});

// Helper to calculate expected totals for a reading
function calculateTotals(reading: {
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
}) {
  const activePower =
    (reading.activePower1 || 0) +
    (reading.activePower2 || 0) +
    (reading.activePower3 || 0) +
    (reading.activePower4 || 0) +
    (reading.activePower5 || 0) +
    (reading.activePower6 || 0);

  const muxPower =
    (reading.muxPower1 || 0) +
    (reading.muxPower2 || 0) +
    (reading.muxPower3 || 0) +
    (reading.muxPower4 || 0) +
    (reading.muxPower5 || 0) +
    (reading.muxPower6 || 0);

  return { activePower, muxPower };
}

describe('Property 7: API Aggregation Correctness', () => {
  // Property: Sum aggregation should be mathematically correct
  it('should calculate correct sum for readings within interval', () => {
    fc.assert(
      fc.property(
        fc.array(powerReadingArb, { minLength: 1, maxLength: 20 }),
        (readings) => {
          // Use a wide interval that includes all readings
          const timestamps = readings.map(r => r.timestamp.getTime());
          const intervalStart = new Date(Math.min(...timestamps) - 1000);
          const intervalEnd = new Date(Math.max(...timestamps) + 1000);

          const result = aggregateReadings(readings, intervalStart, intervalEnd, 'test');

          // Calculate expected sum manually
          let expectedActivePowerSum = 0;
          let expectedMuxPowerSum = 0;

          for (const reading of readings) {
            const totals = calculateTotals(reading);
            expectedActivePowerSum += totals.activePower;
            expectedMuxPowerSum += totals.muxPower;
          }

          // Allow for floating point precision issues
          expect(result.activePowerSum).toBeCloseTo(expectedActivePowerSum, 5);
          expect(result.muxPowerSum).toBeCloseTo(expectedMuxPowerSum, 5);
          expect(result.readingCount).toBe(readings.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Average aggregation should be mathematically correct
  it('should calculate correct average for readings within interval', () => {
    fc.assert(
      fc.property(
        fc.array(powerReadingArb, { minLength: 1, maxLength: 20 }),
        (readings) => {
          // Use a wide interval that includes all readings
          const timestamps = readings.map(r => r.timestamp.getTime());
          const intervalStart = new Date(Math.min(...timestamps) - 1000);
          const intervalEnd = new Date(Math.max(...timestamps) + 1000);

          const result = aggregateReadings(readings, intervalStart, intervalEnd, 'test');

          // Calculate expected average manually
          let totalActivePower = 0;
          let totalMuxPower = 0;

          for (const reading of readings) {
            const totals = calculateTotals(reading);
            totalActivePower += totals.activePower;
            totalMuxPower += totals.muxPower;
          }

          const expectedActivePowerAvg = totalActivePower / readings.length;
          const expectedMuxPowerAvg = totalMuxPower / readings.length;

          // Allow for floating point precision issues
          expect(result.activePowerAvg).toBeCloseTo(expectedActivePowerAvg, 5);
          expect(result.muxPowerAvg).toBeCloseTo(expectedMuxPowerAvg, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Reading count should match actual readings in interval
  it('should count only readings within the interval', () => {
    fc.assert(
      fc.property(
        fc.array(powerReadingArb, { minLength: 0, maxLength: 20 }),
        fc.integer({ min: new Date('2024-01-01').getTime(), max: new Date('2024-06-30').getTime() }),
        fc.integer({ min: new Date('2024-07-01').getTime(), max: new Date('2024-12-31').getTime() }),
        (readings, ts1, ts2) => {
          const intervalStart = new Date(ts1);
          const intervalEnd = new Date(ts2);
          
          const result = aggregateReadings(readings, intervalStart, intervalEnd, 'test');

          // Count readings that fall within the interval manually
          const expectedCount = readings.filter(
            r => r.timestamp >= intervalStart && r.timestamp < intervalEnd
          ).length;

          expect(result.readingCount).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Empty interval should return zero values
  it('should return zero values for empty intervals', () => {
    fc.assert(
      fc.property(
        fc.array(powerReadingArb, { minLength: 0, maxLength: 10 }),
        fc.integer({ min: new Date('2025-01-01').getTime(), max: new Date('2025-06-30').getTime() }),
        fc.integer({ min: new Date('2025-07-01').getTime(), max: new Date('2025-12-31').getTime() }),
        (readings, ts1, ts2) => {
          // Ensure interval is in the future (no readings will match)
          const intervalStart = new Date(ts1);
          const intervalEnd = new Date(ts2);

          // Filter readings to only include those from 2024
          const pastReadings = readings.filter(r => r.timestamp.getFullYear() === 2024);

          const result = aggregateReadings(pastReadings, intervalStart, intervalEnd, 'test');

          expect(result.readingCount).toBe(0);
          expect(result.activePowerSum).toBe(0);
          expect(result.activePowerAvg).toBe(0);
          expect(result.muxPowerSum).toBe(0);
          expect(result.muxPowerAvg).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Aggregation should handle null values correctly
  it('should treat null power values as zero in aggregation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            timestamp: fc.integer({ 
              min: new Date('2024-01-01').getTime(), 
              max: new Date('2024-12-31').getTime() 
            }).map(ts => new Date(ts)),
            activePower1: fc.constant(null),
            activePower2: fc.constant(null),
            activePower3: fc.constant(null),
            activePower4: fc.constant(null),
            activePower5: fc.constant(null),
            activePower6: fc.constant(null),
            muxPower1: fc.constant(null),
            muxPower2: fc.constant(null),
            muxPower3: fc.constant(null),
            muxPower4: fc.constant(null),
            muxPower5: fc.constant(null),
            muxPower6: fc.constant(null),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (readings) => {
          const timestamps = readings.map(r => r.timestamp.getTime());
          const intervalStart = new Date(Math.min(...timestamps) - 1000);
          const intervalEnd = new Date(Math.max(...timestamps) + 1000);

          const result = aggregateReadings(readings, intervalStart, intervalEnd, 'test');

          // All null values should result in zero sums
          expect(result.activePowerSum).toBe(0);
          expect(result.muxPowerSum).toBe(0);
          expect(result.activePowerAvg).toBe(0);
          expect(result.muxPowerAvg).toBe(0);
          expect(result.readingCount).toBe(readings.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
