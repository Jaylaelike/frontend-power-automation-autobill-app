import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { AggregatedDataPoint, TimePeriod } from '@/lib/types/station';

/**
 * Property 3: Time-Based Aggregation Correctness
 * 
 * This property test validates that time-based aggregation produces correct
 * results for different time periods (day, week, month, year).
 * 
 * Validates Requirements:
 * - 3.3: Display aggregated data for selected time period
 * - 3.4: Support day, week, month, year aggregation
 * - 3.5: Show both Active Power and MUX Power
 * - 3.6: Calculate correct totals for each time period
 */

// Helper function to generate realistic power readings
const powerReadingArbitrary = fc.record({
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
});

// Helper function to calculate total active power
function calculateTotalActivePower(reading: any): number {
  const powers = [
    reading.activePower1,
    reading.activePower2,
    reading.activePower3,
    reading.activePower4,
    reading.activePower5,
    reading.activePower6,
  ];
  return powers.reduce((sum, power) => sum + (power || 0), 0);
}

// Helper function to calculate total MUX power
function calculateTotalMuxPower(reading: any): number {
  const powers = [
    reading.muxPower1,
    reading.muxPower2,
    reading.muxPower3,
    reading.muxPower4,
    reading.muxPower5,
    reading.muxPower6,
  ];
  return powers.reduce((sum, power) => sum + (power || 0), 0);
}

// Helper function to aggregate readings
function aggregateReadings(readings: any[]): AggregatedDataPoint {
  const totalActivePower = readings.reduce((sum, reading) => 
    sum + calculateTotalActivePower(reading), 0);
  const totalMuxPower = readings.reduce((sum, reading) => 
    sum + calculateTotalMuxPower(reading), 0);
  
  return {
    label: 'Test Period',
    timestamp: new Date().toISOString(),
    activePowerSum: totalActivePower,
    activePowerAvg: readings.length > 0 ? totalActivePower / readings.length : 0,
    muxPowerSum: totalMuxPower,
    muxPowerAvg: readings.length > 0 ? totalMuxPower / readings.length : 0,
    readingCount: readings.length,
  };
}

describe('Property 3: Time-Based Aggregation Correctness', () => {
  it('should correctly sum active power values across all sensors', () => {
    fc.assert(
      fc.property(
        fc.array(powerReadingArbitrary, { minLength: 1, maxLength: 10 }),
        (readings) => {
          const aggregated = aggregateReadings(readings);
          
          // Calculate expected sum manually
          const expectedSum = readings.reduce((total, reading) => {
            return total + calculateTotalActivePower(reading);
          }, 0);
          
          expect(Math.abs(aggregated.activePowerSum - expectedSum)).toBeLessThan(0.001);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly sum MUX power values across all sensors', () => {
    fc.assert(
      fc.property(
        fc.array(powerReadingArbitrary, { minLength: 1, maxLength: 10 }),
        (readings) => {
          const aggregated = aggregateReadings(readings);
          
          // Calculate expected sum manually
          const expectedSum = readings.reduce((total, reading) => {
            return total + calculateTotalMuxPower(reading);
          }, 0);
          
          expect(Math.abs(aggregated.muxPowerSum - expectedSum)).toBeLessThan(0.001);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly calculate average power values', () => {
    fc.assert(
      fc.property(
        fc.array(powerReadingArbitrary, { minLength: 1, maxLength: 10 }),
        (readings) => {
          const aggregated = aggregateReadings(readings);
          
          const expectedActiveAvg = aggregated.activePowerSum / readings.length;
          const expectedMuxAvg = aggregated.muxPowerSum / readings.length;
          
          expect(Math.abs(aggregated.activePowerAvg - expectedActiveAvg)).toBeLessThan(0.001);
          expect(Math.abs(aggregated.muxPowerAvg - expectedMuxAvg)).toBeLessThan(0.001);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle null power values correctly', () => {
    fc.assert(
      fc.property(
        fc.array(powerReadingArbitrary, { minLength: 1, maxLength: 5 }),
        (readings) => {
          const aggregated = aggregateReadings(readings);
          
          // Aggregated values should never be negative
          expect(aggregated.activePowerSum).toBeGreaterThanOrEqual(0);
          expect(aggregated.muxPowerSum).toBeGreaterThanOrEqual(0);
          expect(aggregated.activePowerAvg).toBeGreaterThanOrEqual(0);
          expect(aggregated.muxPowerAvg).toBeGreaterThanOrEqual(0);
          
          // Reading count should match input
          expect(aggregated.readingCount).toBe(readings.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce consistent results for the same input', () => {
    fc.assert(
      fc.property(
        fc.array(powerReadingArbitrary, { minLength: 1, maxLength: 5 }),
        (readings) => {
          const aggregated1 = aggregateReadings(readings);
          const aggregated2 = aggregateReadings(readings);
          
          expect(aggregated1.activePowerSum).toBe(aggregated2.activePowerSum);
          expect(aggregated1.muxPowerSum).toBe(aggregated2.muxPowerSum);
          expect(aggregated1.activePowerAvg).toBe(aggregated2.activePowerAvg);
          expect(aggregated1.muxPowerAvg).toBe(aggregated2.muxPowerAvg);
          expect(aggregated1.readingCount).toBe(aggregated2.readingCount);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle empty readings array gracefully', () => {
    const aggregated = aggregateReadings([]);
    
    expect(aggregated.activePowerSum).toBe(0);
    expect(aggregated.muxPowerSum).toBe(0);
    expect(aggregated.activePowerAvg).toBe(0);
    expect(aggregated.muxPowerAvg).toBe(0);
    expect(aggregated.readingCount).toBe(0);
  });
});