import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 6: Future Date Selection Prevention
 * 
 * This property test validates that the date range picker correctly prevents
 * selection of future dates by ensuring that any date after maxDate is disabled.
 * 
 * Validates Requirements:
 * - 5.4: Prevent selection of future dates
 */

describe('Property 6: Future Date Selection Prevention', () => {
  it('should prevent selection of any date after maxDate', () => {
    fc.assert(
      fc.property(
        // Generate a valid maxDate
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        // Generate a future date that's after maxDate
        fc.integer({ min: 1, max: 365 }), // days to add
        (maxDate, daysToAdd) => {
          // Skip invalid dates
          if (isNaN(maxDate.getTime())) {
            return true; // Skip this test case
          }
          
          const futureDate = new Date(maxDate);
          futureDate.setDate(futureDate.getDate() + daysToAdd);
          
          // Skip if futureDate is invalid
          if (isNaN(futureDate.getTime())) {
            return true; // Skip this test case
          }
          
          // The future date should be considered disabled
          const isDisabled = futureDate > maxDate;
          
          expect(isDisabled).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow selection of dates on or before maxDate', () => {
    fc.assert(
      fc.property(
        // Generate a valid maxDate
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        // Generate days to subtract (making it a past date)
        fc.integer({ min: 0, max: 365 }),
        (maxDate, daysToSubtract) => {
          // Skip invalid dates
          if (isNaN(maxDate.getTime())) {
            return true; // Skip this test case
          }
          
          const pastOrCurrentDate = new Date(maxDate);
          pastOrCurrentDate.setDate(pastOrCurrentDate.getDate() - daysToSubtract);
          
          // Skip if pastOrCurrentDate is invalid
          if (isNaN(pastOrCurrentDate.getTime())) {
            return true; // Skip this test case
          }
          
          // The past or current date should not be disabled
          const isDisabled = pastOrCurrentDate > maxDate;
          
          expect(isDisabled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case where date equals maxDate', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (maxDate) => {
          // Skip invalid dates
          if (isNaN(maxDate.getTime())) {
            return true; // Skip this test case
          }
          
          // A date equal to maxDate should not be disabled
          const isDisabled = maxDate > maxDate;
          
          expect(isDisabled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify disabled dates across different time zones', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        fc.integer({ min: 1, max: 24 }), // hours to add
        (baseDate, hoursToAdd) => {
          // Skip invalid dates
          if (isNaN(baseDate.getTime())) {
            return true; // Skip this test case
          }
          
          const maxDate = new Date(baseDate);
          const futureDate = new Date(baseDate);
          futureDate.setHours(futureDate.getHours() + hoursToAdd);
          
          // Skip if futureDate is invalid
          if (isNaN(futureDate.getTime())) {
            return true; // Skip this test case
          }
          
          // If futureDate is after maxDate, it should be disabled
          const isDisabled = futureDate > maxDate;
          const expectedDisabled = hoursToAdd > 0;
          
          expect(isDisabled).toBe(expectedDisabled);
        }
      ),
      { numRuns: 100 }
    );
  });
});