"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Globe, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StationInfo } from "@/lib/types/station";

interface StationHeaderProps {
  station: StationInfo;
  isLoading: boolean;
}

function getStatusColor(status: StationInfo['status']) {
  switch (status) {
    case 'active':
      return 'border-chart-3/50 text-chart-3';
    case 'stale':
      return 'border-accent/50 text-accent';
    case 'offline':
      return 'border-destructive/50 text-destructive';
    default:
      return 'border-muted/50 text-muted-foreground';
  }
}

function getStatusIcon(status: StationInfo['status']) {
  switch (status) {
    case 'active':
      return <Activity className="h-3 w-3 animate-pulse" />;
    case 'stale':
      return <Activity className="h-3 w-3" />;
    case 'offline':
      return <Activity className="h-3 w-3 opacity-50" />;
    default:
      return <Activity className="h-3 w-3" />;
  }
}

export function StationHeader({ station, isLoading }: StationHeaderProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <div className="flex-1">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Back button and station info */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {station.name}
                </h1>
                <Badge
                  variant="outline"
                  className={`gap-2 ${getStatusColor(station.status)}`}
                >
                  {getStatusIcon(station.status)}
                  {station.status.charAt(0).toUpperCase() + station.status.slice(1)}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {station.ipAddress && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    <span className="font-mono">{station.ipAddress}</span>
                  </div>
                )}
                {station.scene && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{station.scene}</span>
                  </div>
                )}
                {station.latestReading && (
                  <div className="text-xs">
                    Last reading: {new Date(station.latestReading.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}