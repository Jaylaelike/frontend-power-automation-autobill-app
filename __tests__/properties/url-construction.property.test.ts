import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 1: URL Construction Contains Station ID
 * 
 * This property test validates that URLs constructed for station detail pages
 * correctly contain the station ID and follow the expected pattern.
 * 
 * Validates Requirements:
 * - 1.3: Navigate to station detail page with correct station ID in URL
 */

// Helper function to construct station detail URL
function constructStationDetailUrl(stationId: string, baseUrl: string = ''): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanStationId = stationId.trim();
  
  if (!cleanStationId) {
    throw new Error('Station ID cannot be empty');
  }
  
  return `${cleanBaseUrl}/station/${encodeURIComponent(cleanStationId)}`;
}

// Helper function to extract station ID from URL
function extractStationIdFromUrl(url: string): string | null {
  const match = url.match(/\/station\/([^\/\?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

describe('Property 1: URL Construction Contains Station ID', () => {
  it('should construct URLs that contain the original station ID for simple IDs', () => {
    fc.assert(
      fc.property(
        // Generate simple alphanumeric station IDs
        fc.oneof(
          fc.integer({ min: 1, max: 999999 }).map(n => n.toString()),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.uuid()
        ),
        (stationId) => {
          const url = constructStationDetailUrl(stationId);
          const extractedId = extractStationIdFromUrl(url);
          
          expect(extractedId).toBe(stationId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should construct valid URLs with different base URLs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        fc.oneof(
          fc.constant(''),
          fc.constant('https://example.com'),
          fc.constant('http://localhost:3000'),
          fc.constant('/dashboard')
        ),
        (stationId, baseUrl) => {
          const url = constructStationDetailUrl(stationId, baseUrl);
          
          // URL should contain the station ID
          expect(url).toContain(`/station/${encodeURIComponent(stationId)}`);
          
          // URL should contain the base URL if provided
          if (baseUrl) {
            expect(url).toContain(baseUrl);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle numeric station IDs correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999999 }),
        (stationId) => {
          const stationIdStr = stationId.toString();
          const url = constructStationDetailUrl(stationIdStr);
          const extractedId = extractStationIdFromUrl(url);
          
          expect(extractedId).toBe(stationIdStr);
          expect(parseInt(extractedId!)).toBe(stationId);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should produce consistent URLs for the same station ID', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        (stationId) => {
          const url1 = constructStationDetailUrl(stationId);
          const url2 = constructStationDetailUrl(stationId);
          
          expect(url1).toBe(url2);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject empty or whitespace-only station IDs', () => {
    const invalidIds = ['', '   ', '\t', '\n', '  \t  \n  '];
    
    invalidIds.forEach(invalidId => {
      expect(() => constructStationDetailUrl(invalidId)).toThrow('Station ID cannot be empty');
    });
  });

  it('should handle special characters in station IDs correctly', () => {
    const specialCharStationIds = [
      'station-123',
      'station_456',
      'station.789',
    ];

    specialCharStationIds.forEach(stationId => {
      const url = constructStationDetailUrl(stationId);
      const extractedId = extractStationIdFromUrl(url);
      
      expect(extractedId).toBe(stationId);
      expect(url).toContain('/station/');
    });
  });

  it('should maintain URL structure integrity', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        (stationId) => {
          const url = constructStationDetailUrl(stationId);
          
          // URL should start with /station/
          expect(url).toMatch(/^.*\/station\//);
          
          // URL should not have double slashes (except in protocol)
          expect(url.replace(/^https?:\/\//, '')).not.toMatch(/\/\//);
          
          // URL should end with the encoded station ID
          expect(url.endsWith(encodeURIComponent(stationId))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});