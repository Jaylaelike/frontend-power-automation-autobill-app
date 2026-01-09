/**
 * Property Test: API Date Validation
 * Feature: station-detail-page, Property 8: API Date Validation
 * 
 * For any API request with invalid date parameters (malformed dates, end date before start date,
 * missing required parameters), the API SHALL return an appropriate error response with status
 * code 400 and descriptive error message.
 * 
 * Validates: Requirements 6.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateDateRange } from '@/app/api/station/[id]/historical/route';

// Helper to generate valid dates within a range
const validDateArb = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: Date.now() - 24 * 60 * 60 * 1000 // Yesterday
}).map(ts => new Date(ts));

const pastDateArb = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: Date.now() 
}).map(ts => new Date(ts));

describe('Property 8: API Date Validation', () => {
  // Property: Missing parameters should always return an error
  it('should return error for missing from parameter', () => {
    fc.assert(
      fc.property(
        pastDateArb,
        fc.constantFrom('day', 'week', 'month', 'year'),
        (toDate, period) => {
          const result = validateDateRange(null, toDate.toISOString(), period);
          expect(result).not.toBeNull();
          expect(result?.code).toBe('MISSING_FROM_DATE');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return error for missing to parameter', () => {
    fc.assert(
      fc.property(
        validDateArb,
        fc.constantFrom('day', 'week', 'month', 'year'),
        (fromDate, period) => {
          const result = validateDateRange(fromDate.toISOString(), null, period);
          expect(result).not.toBeNull();
          expect(result?.code).toBe('MISSING_TO_DATE');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return error for missing period parameter', () => {
    fc.assert(
      fc.property(
        validDateArb,
        fc.integer({ min: 0, max: 30 }),
        (fromDate, daysToAdd) => {
          const toDate = new Date(Math.min(
            fromDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000,
            Date.now()
          ));
          const result = validateDateRange(fromDate.toISOString(), toDate.toISOString(), null);
          expect(result).not.toBeNull();
          expect(result?.code).toBe('MISSING_PERIOD');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Malformed dates should always return an error
  it('should return error for malformed from date', () => {
    fc.assert(
      fc.property(
        // Generate non-empty strings that are not valid dates
        fc.string({ minLength: 1 }).filter(s => s.trim() !== '' && isNaN(new Date(s).getTime())),
        pastDateArb,
        fc.constantFrom('day', 'week', 'month', 'year'),
        (invalidFrom, toDate, period) => {
          const result = validateDateRange(invalidFrom, toDate.toISOString(), period);
          expect(result).not.toBeNull();
          expect(result?.code).toBe('INVALID_FROM_DATE');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return error for malformed to date', () => {
    fc.assert(
      fc.property(
        validDateArb,
        // Generate non-empty strings that are not valid dates
        fc.string({ minLength: 1 }).filter(s => s.trim() !== '' && isNaN(new Date(s).getTime())),
        fc.constantFrom('day', 'week', 'month', 'year'),
        (fromDate, invalidTo, period) => {
          const result = validateDateRange(fromDate.toISOString(), invalidTo, period);
          expect(result).not.toBeNull();
          expect(result?.code).toBe('INVALID_TO_DATE');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: End date before start date should always return an error
  it('should return error when end date is before start date', () => {
    fc.assert(
      fc.property(
        validDateArb,
        fc.integer({ min: 1, max: 365 }), // Days to subtract
        fc.constantFrom('day', 'week', 'month', 'year'),
        (fromDate, daysToSubtract, period) => {
          const toDate = new Date(fromDate.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
          const result = validateDateRange(fromDate.toISOString(), toDate.toISOString(), period);
          expect(result).not.toBeNull();
          expect(result?.code).toBe('INVALID_DATE_RANGE');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Future end dates should always return an error
  it('should return error when end date is in the future', () => {
    fc.assert(
      fc.property(
        validDateArb,
        fc.integer({ min: 1, max: 365 }), // Days to add to current date
        fc.constantFrom('day', 'week', 'month', 'year'),
        (fromDate, daysToAdd, period) => {
          const futureDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
          const result = validateDateRange(fromDate.toISOString(), futureDate.toISOString(), period);
          expect(result).not.toBeNull();
          expect(result?.code).toBe('FUTURE_DATE');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Invalid period values should always return an error
  it('should return error for invalid period values', () => {
    fc.assert(
      fc.property(
        validDateArb,
        fc.integer({ min: 0, max: 30 }),
        // Generate non-empty strings that are not valid periods
        fc.string({ minLength: 1 }).filter(s => s.trim() !== '' && !['day', 'week', 'month', 'year'].includes(s)),
        (fromDate, daysToAdd, invalidPeriod) => {
          const toDate = new Date(Math.min(
            fromDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000,
            Date.now()
          ));
          const result = validateDateRange(fromDate.toISOString(), toDate.toISOString(), invalidPeriod);
          expect(result).not.toBeNull();
          expect(result?.code).toBe('INVALID_PERIOD');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Valid parameters should return null (no error)
  it('should return null for valid date range parameters', () => {
    fc.assert(
      fc.property(
        validDateArb,
        fc.integer({ min: 0, max: 30 }), // Days to add (keeping within past)
        fc.constantFrom('day', 'week', 'month', 'year'),
        (fromDate, daysToAdd, period) => {
          const toDate = new Date(Math.min(
            fromDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000,
            Date.now()
          ));
          const result = validateDateRange(fromDate.toISOString(), toDate.toISOString(), period);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
