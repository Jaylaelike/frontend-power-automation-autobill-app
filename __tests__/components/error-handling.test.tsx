import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import StationDetailPage from '@/app/station/[id]/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}));

// Mock the components to focus on error handling logic
vi.mock('@/components/station-header', () => ({
  StationHeader: ({ station, isLoading }: any) => (
    <div data-testid="station-header">
      {isLoading ? 'Loading header...' : `Station: ${station?.name || 'Unknown'}`}
    </div>
  ),
}));

vi.mock('@/components/summary-stats', () => ({
  SummaryStats: ({ latestReading, isLoading }: any) => (
    <div data-testid="summary-stats">
      {isLoading ? 'Loading stats...' : `Power: ${latestReading?.activePower1 || 0}W`}
    </div>
  ),
}));

vi.mock('@/components/date-range-picker', () => ({
  DateRangePicker: ({ dateRange, onDateRangeChange }: any) => (
    <div data-testid="date-range-picker">Date Range Picker</div>
  ),
}));

vi.mock('@/components/time-period-selector', () => ({
  TimePeriodSelector: ({ selectedPeriod, onPeriodChange }: any) => (
    <div data-testid="time-period-selector">Period: {selectedPeriod}</div>
  ),
}));

vi.mock('@/components/historical-bar-chart', () => ({
  HistoricalBarChart: ({ error, isLoading }: any) => (
    <div data-testid="historical-chart">
      {isLoading ? 'Loading chart...' : error ? `Chart Error: ${error}` : 'Historical Chart'}
    </div>
  ),
}));

vi.mock('@/components/realtime-line-chart', () => ({
  RealtimeLineChart: ({ error, isLoading }: any) => (
    <div data-testid="realtime-chart">
      {isLoading ? 'Loading chart...' : error ? `Chart Error: ${error}` : 'Realtime Chart'}
    </div>
  ),
}));

vi.mock('@/components/page-layout', () => ({
  PageLayout: ({ children }: any) => <div data-testid="page-layout">{children}</div>,
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Error Handling Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for testing
        },
      },
    });
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({ id: 'test-station-123' });
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should display station not found error when station API returns 404', async () => {
    // Mock station API to return 404
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/station/test-station-123')) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ 
            error: 'Station not found',
            code: 'STATION_NOT_FOUND' 
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithQueryClient(<StationDetailPage />);

    // Should show loading skeletons initially
    expect(screen.getAllByRole('generic').some(el => el.hasAttribute('data-slot') && el.getAttribute('data-slot') === 'skeleton')).toBe(true);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/Station not found/)).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByText(/Try again/)).toBeInTheDocument();
  });

  it('should display API failure error with retry option', async () => {
    // Mock station API to return 500
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/station/test-station-123')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ 
            error: 'Internal server error',
            code: 'INTERNAL_ERROR' 
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithQueryClient(<StationDetailPage />);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/Internal server error/)).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByText(/Try again/)).toBeInTheDocument();
  });

  it('should display loading skeleton while fetching station data', async () => {
    // Mock station API to be slow
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/station/test-station-123')) {
        return new Promise(() => {}); // Never resolves
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithQueryClient(<StationDetailPage />);

    // Should show loading skeletons
    expect(screen.getAllByRole('generic').some(el => el.hasAttribute('data-slot') && el.getAttribute('data-slot') === 'skeleton')).toBe(true);
    
    // Should not show any content yet
    expect(screen.queryByTestId('station-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('summary-stats')).not.toBeInTheDocument();
  });

  it('should handle historical data API failure gracefully', async () => {
    // Mock station API to succeed
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/station/test-station-123') && !url.includes('historical') && !url.includes('realtime')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            station: {
              id: 'test-station-123',
              name: 'Test Station',
              ipAddress: '192.168.1.100',
              scene: 'Test Scene',
              status: 'active',
              latestReading: {
                id: '1',
                stationId: 'test-station-123',
                timestamp: new Date().toISOString(),
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
              },
            },
            timestamp: new Date().toISOString(),
          }),
        });
      }
      
      // Mock historical API to fail
      if (url.includes('historical')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ 
            error: 'Failed to fetch historical data',
            code: 'HISTORICAL_DATA_ERROR' 
          }),
        });
      }
      
      // Mock realtime API to succeed
      if (url.includes('realtime')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            stationId: 'test-station-123',
            readings: [],
            latestTimestamp: new Date().toISOString(),
          }),
        });
      }
      
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithQueryClient(<StationDetailPage />);

    // Wait for station data to load
    await waitFor(() => {
      expect(screen.getByTestId('station-header')).toBeInTheDocument();
    });

    // Historical chart should show error
    await waitFor(() => {
      expect(screen.getByText(/Chart Error: Failed to fetch historical data/)).toBeInTheDocument();
    });

    // Realtime chart should work fine
    expect(screen.getByText('Realtime Chart')).toBeInTheDocument();
  });

  it('should handle realtime data API failure gracefully', async () => {
    // Mock station API to succeed
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/station/test-station-123') && !url.includes('historical') && !url.includes('realtime')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            station: {
              id: 'test-station-123',
              name: 'Test Station',
              ipAddress: '192.168.1.100',
              scene: 'Test Scene',
              status: 'active',
              latestReading: null,
            },
            timestamp: new Date().toISOString(),
          }),
        });
      }
      
      // Mock historical API to succeed
      if (url.includes('historical')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            stationId: 'test-station-123',
            dateRange: {
              from: new Date().toISOString(),
              to: new Date().toISOString(),
            },
            timePeriod: 'day',
            data: [],
            metadata: {
              totalReadings: 0,
              aggregationMethod: 'sum',
            },
          }),
        });
      }
      
      // Mock realtime API to fail
      if (url.includes('realtime')) {
        return Promise.resolve({
          ok: false,
          status: 503,
          json: () => Promise.resolve({ 
            error: 'Realtime service unavailable',
            code: 'REALTIME_SERVICE_ERROR' 
          }),
        });
      }
      
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithQueryClient(<StationDetailPage />);

    // Wait for station data to load
    await waitFor(() => {
      expect(screen.getByTestId('station-header')).toBeInTheDocument();
    });

    // Historical chart should work fine
    await waitFor(() => {
      expect(screen.getByText('Historical Chart')).toBeInTheDocument();
    });

    // Realtime chart should show error
    await waitFor(() => {
      expect(screen.getByText(/Chart Error: Realtime service unavailable/)).toBeInTheDocument();
    });
  });

  it('should handle network errors gracefully', async () => {
    // Mock fetch to throw network error
    mockFetch.mockRejectedValue(new Error('Network error'));

    renderWithQueryClient(<StationDetailPage />);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByText(/Try again/)).toBeInTheDocument();
  });

  it('should display appropriate message when no station data is available', async () => {
    // Mock station API to return null data
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/station/test-station-123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(null),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithQueryClient(<StationDetailPage />);

    // Wait for "no data" message to appear
    await waitFor(() => {
      expect(screen.getByText(/No station data available/)).toBeInTheDocument();
    });
  });
});