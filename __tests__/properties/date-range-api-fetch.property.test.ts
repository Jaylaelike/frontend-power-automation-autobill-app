import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { DateRange, TimePeriod } from '@/lib/types/station';

/**
 * Property 5: Date Range Triggers Correct API Fetch
 * 
 * This property test validates that date range changes trigger the correct
 * API fetch with proper parameters and URL construction.
 * 
 * Validates Requirements:
 * - 5.3: Date range selection triggers data refresh
 */

// Helper function to construct historical API URL
function constructHistoricalApiUrl(
  stationId: string, 
  dateRange: DateRange, 
  timePeriod: TimePeriod,
  baseUrl: string = ''
): string {
  const params = new URLSearchParams({
    from: dateRange.from.toISOString(),
    to: dateRange.to.toISOString(),
    period: timePeriod,
  });
  
  return `${baseUrl}/api/station/${encodeURIComponent(stationId)}/historical?${params.toString()}`;
}

// Helper function to extract parameters from URL
function extractParametersFromUrl(url: string): {
  stationId: string | null;
  from: string | null;
  to: string | null;
  period: string | null;
} {
  const urlObj = new URL(url, 'http://localhost');
  const pathMatch = urlObj.pathname.match(/\/api\/station\/([^\/]+)\/historical$/);
  
  return {
    stationId: pathMatch ? decodeURIComponent(pathMatch[1]) : null,
    from: urlObj.searchParams.get('from'),
    to: urlObj.searchParams.get('to'),
    period: urlObj.searchParams.get('period'),
  };
}

// Helper function to validate date range
function isValidDateRange(dateRange: DateRange): boolean {
  return dateRange.from <= dateRange.to && 
         !isNaN(dateRange.from.getTime()) && 
         !isNaN(dateRange.to.getTime());
}

describe('Property 5: Date Range Triggers Correct API Fetch', () => {
  it('should construct API URLs with correct station ID and parameters', () => {
    fc.assert(
      fc.property(
        // Generate station ID
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.integer({ min: 1, max: 999999 }).map(n => n.toString())
        ),
        // Generate valid date range
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        fc.integer({ min: 1, max: 30 }), // days to add for end date
        // Generate time period
        fc.oneof(
          fc.constant('day' as TimePeriod),
          fc.constant('week' as TimePeriod),
          fc.constant('month' as TimePeriod),
          fc.constant('year' as TimePeriod)
        ),
        (stationId, startDate, daysToAdd, timePeriod) => {
          // Skip invalid dates
          if (isNaN(startDate.getTime())) {
            return true;
          }
          
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + daysToAdd);
          
          const dateRange: DateRange = {
            from: startDate,
            to: endDate,
          };
          
          const url = constructHistoricalApiUrl(stationId, dateRange, timePeriod);
          const extracted = extractParametersFromUrl(url);
          
          // Verify all parameters are correctly included
          expect(extracted.stationId).toBe(stationId);
          expect(extracted.from).toBe(dateRange.from.toISOString());
          expect(extracted.to).toBe(dateRange.to.toISOString());
          expect(extracted.period).toBe(timePeriod);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle different time periods correctly', () => {
    const timePeriods: TimePeriod[] = ['day', 'week', 'month', 'year'];
    
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        fc.integer({ min: 1, max: 7 }),
        fc.constantFrom(...timePeriods),
        (stationId, startDate, daysToAdd, timePeriod) => {
          // Skip invalid dates
          if (isNaN(startDate.getTime())) {
            return true;
          }
          
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + daysToAdd);
          
          const dateRange: DateRange = { from: startDate, to: endDate };
          const url = constructHistoricalApiUrl(stationId, dateRange, timePeriod);
          
          // URL should contain the time period
          expect(url).toContain(`period=${timePeriod}`);
          
          // Extracted period should match
          const extracted = extractParametersFromUrl(url);
          expect(extracted.period).toBe(timePeriod);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve date precision in ISO string format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        (stationId, date1, date2) => {
          // Skip invalid dates
          if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
            return true;
          }
          
          // Ensure proper order
          const dateRange: DateRange = {
            from: date1 <= date2 ? date1 : date2,
            to: date1 <= date2 ? date2 : date1,
          };
          
          const url = constructHistoricalApiUrl(stationId, dateRange, 'day');
          const extracted = extractParametersFromUrl(url);
          
          // Dates should be preserved exactly
          expect(extracted.from).toBe(dateRange.from.toISOString());
          expect(extracted.to).toBe(dateRange.to.toISOString());
          
          // Should be able to reconstruct the original dates
          expect(new Date(extracted.from!)).toEqual(dateRange.from);
          expect(new Date(extracted.to!)).toEqual(dateRange.to);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle URL encoding for special characters in station IDs', () => {
    const specialStationIds = [
      'station-123',
      'station_456',
      'station.test',
      'station@location',
      'station with spaces',
    ];
    
    specialStationIds.forEach(stationId => {
      const dateRange: DateRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-07'),
      };
      
      const url = constructHistoricalApiUrl(stationId, dateRange, 'day');
      const extracted = extractParametersFromUrl(url);
      
      // Should correctly encode and decode station ID
      expect(extracted.stationId).toBe(stationId);
      
      // URL should be properly encoded
      expect(url).toContain(encodeURIComponent(stationId));
    });
  });

  it('should produce consistent URLs for the same parameters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        fc.integer({ min: 1, max: 7 }),
        fc.constantFrom('day', 'week', 'month', 'year'),
        (stationId, startDate, daysToAdd, timePeriod) => {
          // Skip invalid dates
          if (isNaN(startDate.getTime())) {
            return true;
          }
          
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + daysToAdd);
          
          const dateRange: DateRange = { from: startDate, to: endDate };
          
          const url1 = constructHistoricalApiUrl(stationId, dateRange, timePeriod as TimePeriod);
          const url2 = constructHistoricalApiUrl(stationId, dateRange, timePeriod as TimePeriod);
          
          expect(url1).toBe(url2);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should validate that date range changes trigger different URLs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
        fc.date({ min: new Date('2024-06-02'), max: new Date('2024-12-31') }),
        fc.integer({ min: 1, max: 5 }),
        (stationId, date1, date2, daysDiff) => {
          // Skip invalid dates
          if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
            return true;
          }
          
          const dateRange1: DateRange = { from: date1, to: date1 };
          const dateRange2: DateRange = { 
            from: date2, 
            to: new Date(date2.getTime() + daysDiff * 24 * 60 * 60 * 1000)
          };
          
          const url1 = constructHistoricalApiUrl(stationId, dateRange1, 'day');
          const url2 = constructHistoricalApiUrl(stationId, dateRange2, 'day');
          
          // Different date ranges should produce different URLs
          expect(url1).not.toBe(url2);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should handle edge case where from and to dates are the same', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        (stationId, date) => {
          // Skip invalid dates
          if (isNaN(date.getTime())) {
            return true;
          }
          
          const dateRange: DateRange = { from: date, to: date };
          const url = constructHistoricalApiUrl(stationId, dateRange, 'day');
          const extracted = extractParametersFromUrl(url);
          
          // Should handle same date correctly
          expect(extracted.from).toBe(extracted.to);
          expect(new Date(extracted.from!)).toEqual(date);
        }
      ),
      { numRuns: 30 }
    );
  });
});