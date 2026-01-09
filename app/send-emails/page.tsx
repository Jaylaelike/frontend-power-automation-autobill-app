'use client';

import { useState, useEffect } from 'react';
import { SendEmailForm } from '@/components/send-email-form';
import { PowerReading } from '@/lib/pdf-generator';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { PageLayout } from '@/components/page-layout';

export default function SendEmailsPage() {
  const [powerReadings, setPowerReadings] = useState<PowerReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPowerReadings();
  }, []);

  const fetchPowerReadings = async () => {
    try {
      const response = await fetch('/api/power-readings-for-email');
      if (response.ok) {
        const data = await response.json();
        setPowerReadings(data);
      }
    } catch (error) {
      console.error('Failed to fetch power readings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <p>Loading power readings...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <RefreshCw className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">
              Send Email Reports
            </h1>
            <p className="text-sm text-muted-foreground">
              Send power meter reports to selected recipients with PDF attachments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={fetchPowerReadings} 
            variant="outline" 
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Stations'}
          </Button>
        </div>
      </div>
      
      <SendEmailForm powerReadings={powerReadings} />
    </PageLayout>
  );
}