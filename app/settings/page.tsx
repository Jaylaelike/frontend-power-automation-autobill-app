"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Settings, 
  Database, 
  Trash2, 
  Save, 
  RefreshCw, 
  AlertTriangle,
  Clock,
  HardDrive,
  Activity,
  CheckCircle2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SettingsData {
  settings: {
    dbSaveInterval: number;
    updateRate: number;
    connectionTimeout: number;
    reconnectInterval: number;
    maxReconnectAttempts: number;
  };
  database: {
    powerReadingCount: number;
    stationCount: number;
    oldestReading: string | null;
    newestReading: string | null;
  };
}

interface ClearReadingsStats {
  count: number;
  oldestReading: string | null;
  newestReading: string | null;
  estimatedSizeMB: number;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state - allow string or number for better editing experience
  const [dbSaveInterval, setDbSaveInterval] = useState<number | string>(30);
  const [updateRate, setUpdateRate] = useState<number | string>(3);
  const [connectionTimeout, setConnectionTimeout] = useState<number | string>(10);
  const [reconnectInterval, setReconnectInterval] = useState<number | string>(5);
  const [maxReconnectAttempts, setMaxReconnectAttempts] = useState<number | string>(10);

  // Fetch settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery<SettingsData>({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      
      // Update form state with fetched values
      setDbSaveInterval(data.settings.dbSaveInterval / 1000);
      setUpdateRate(data.settings.updateRate / 1000);
      setConnectionTimeout(data.settings.connectionTimeout / 1000);
      setReconnectInterval(data.settings.reconnectInterval / 1000);
      setMaxReconnectAttempts(data.settings.maxReconnectAttempts);
      
      return data;
    },
  });

  // Fetch clear readings stats
  const { data: clearStats, isLoading: clearStatsLoading, refetch: refetchClearStats } = useQuery<ClearReadingsStats>({
    queryKey: ["clear-readings-stats"],
    queryFn: async () => {
      const response = await fetch("/api/settings/clear-readings");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: SettingsData["settings"]) => {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }
      return response.json();
    },
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  // Clear readings mutation
  const clearReadingsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/settings/clear-readings?confirm=true", {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to clear readings");
      }
      return response.json();
    },
    onSuccess: () => {
      setShowClearDialog(false);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["clear-readings-stats"] });
      queryClient.invalidateQueries({ queryKey: ["power-readings"] });
    },
  });

  const handleSaveSettings = () => {
    // Convert all values to numbers before saving
    const numDbSaveInterval = typeof dbSaveInterval === 'string' ? parseInt(dbSaveInterval, 10) || 30 : dbSaveInterval;
    const numUpdateRate = typeof updateRate === 'string' ? parseInt(updateRate, 10) || 3 : updateRate;
    const numConnectionTimeout = typeof connectionTimeout === 'string' ? parseInt(connectionTimeout, 10) || 10 : connectionTimeout;
    const numReconnectInterval = typeof reconnectInterval === 'string' ? parseInt(reconnectInterval, 10) || 5 : reconnectInterval;
    const numMaxReconnectAttempts = typeof maxReconnectAttempts === 'string' ? parseInt(maxReconnectAttempts, 10) || 10 : maxReconnectAttempts;

    saveSettingsMutation.mutate({
      dbSaveInterval: numDbSaveInterval * 1000,
      updateRate: numUpdateRate * 1000,
      connectionTimeout: numConnectionTimeout * 1000,
      reconnectInterval: numReconnectInterval * 1000,
      maxReconnectAttempts: numMaxReconnectAttempts,
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  if (settingsLoading) {
    return (
      <PageLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure monitor intervals and manage database
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-200">Settings Saved</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Settings have been saved. Restart the monitor service for changes to take effect.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Monitor Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Monitor Intervals
              </CardTitle>
              <CardDescription>
                Configure data collection and database save intervals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dbSaveInterval">Database Save Interval (seconds)</Label>
                <Input
                  id="dbSaveInterval"
                  type="number"
                  min={5}
                  max={300}
                  value={dbSaveInterval}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string for editing
                    if (value === '') {
                      setDbSaveInterval('');
                      return;
                    }
                    // Parse and validate the number
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue) && numValue >= 5 && numValue <= 300) {
                      setDbSaveInterval(numValue);
                    } else if (!isNaN(numValue)) {
                      // Allow typing but don't enforce limits until blur
                      setDbSaveInterval(numValue);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === '' || isNaN(parseInt(value, 10))) {
                      setDbSaveInterval(5); // Reset to minimum if invalid
                    } else {
                      const numValue = parseInt(value, 10);
                      if (numValue < 5) setDbSaveInterval(5);
                      else if (numValue > 300) setDbSaveInterval(300);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  How often to save data to database (min: 5 seconds)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="updateRate">WebSocket Update Rate (seconds)</Label>
                <Input
                  id="updateRate"
                  type="number"
                  min={1}
                  max={60}
                  value={updateRate}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setUpdateRate('');
                      return;
                    }
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue) && numValue >= 1 && numValue <= 60) {
                      setUpdateRate(numValue);
                    } else if (!isNaN(numValue)) {
                      setUpdateRate(numValue);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === '' || isNaN(parseInt(value, 10))) {
                      setUpdateRate(1);
                    } else {
                      const numValue = parseInt(value, 10);
                      if (numValue < 1) setUpdateRate(1);
                      else if (numValue > 60) setUpdateRate(60);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  How often to request data from stations (min: 1 second)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="connectionTimeout">Connection Timeout (seconds)</Label>
                <Input
                  id="connectionTimeout"
                  type="number"
                  min={5}
                  max={60}
                  value={connectionTimeout}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setConnectionTimeout('');
                      return;
                    }
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue) && numValue >= 5 && numValue <= 60) {
                      setConnectionTimeout(numValue);
                    } else if (!isNaN(numValue)) {
                      setConnectionTimeout(numValue);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === '' || isNaN(parseInt(value, 10))) {
                      setConnectionTimeout(5);
                    } else {
                      const numValue = parseInt(value, 10);
                      if (numValue < 5) setConnectionTimeout(5);
                      else if (numValue > 60) setConnectionTimeout(60);
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reconnectInterval">Reconnect Interval (seconds)</Label>
                <Input
                  id="reconnectInterval"
                  type="number"
                  min={1}
                  max={60}
                  value={reconnectInterval}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setReconnectInterval('');
                      return;
                    }
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue) && numValue >= 1 && numValue <= 60) {
                      setReconnectInterval(numValue);
                    } else if (!isNaN(numValue)) {
                      setReconnectInterval(numValue);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === '' || isNaN(parseInt(value, 10))) {
                      setReconnectInterval(1);
                    } else {
                      const numValue = parseInt(value, 10);
                      if (numValue < 1) setReconnectInterval(1);
                      else if (numValue > 60) setReconnectInterval(60);
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxReconnectAttempts">Max Reconnect Attempts</Label>
                <Input
                  id="maxReconnectAttempts"
                  type="number"
                  min={1}
                  max={50}
                  value={maxReconnectAttempts}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setMaxReconnectAttempts('');
                      return;
                    }
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue) && numValue >= 1 && numValue <= 50) {
                      setMaxReconnectAttempts(numValue);
                    } else if (!isNaN(numValue)) {
                      setMaxReconnectAttempts(numValue);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === '' || isNaN(parseInt(value, 10))) {
                      setMaxReconnectAttempts(1);
                    } else {
                      const numValue = parseInt(value, 10);
                      if (numValue < 1) setMaxReconnectAttempts(1);
                      else if (numValue > 50) setMaxReconnectAttempts(50);
                    }
                  }}
                />
              </div>

              <Button 
                onClick={handleSaveSettings} 
                className="w-full"
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Settings
              </Button>

              {saveSettingsMutation.isError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {saveSettingsMutation.error?.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Database Management Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Management
              </CardTitle>
              <CardDescription>
                View database statistics and manage power readings data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Database Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    Power Readings
                  </div>
                  <div className="mt-1 text-2xl font-bold">
                    {clearStatsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      clearStats?.count.toLocaleString() || 0
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <HardDrive className="h-4 w-4" />
                    Est. Size
                  </div>
                  <div className="mt-1 text-2xl font-bold">
                    {clearStatsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      `${clearStats?.estimatedSizeMB || 0} MB`
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stations:</span>
                  <Badge variant="secondary">
                    {settingsData?.database.stationCount || 0}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Oldest Reading:</span>
                  <span className="text-xs">
                    {formatDate(clearStats?.oldestReading || null)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Newest Reading:</span>
                  <span className="text-xs">
                    {formatDate(clearStats?.newestReading || null)}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => refetchClearStats()}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Stats
              </Button>

              {/* Clear Data Section */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Clear all power reading data from the database. This action cannot be undone.
                </p>

                <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All Power Readings
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Confirm Data Deletion
                      </DialogTitle>
                      <DialogDescription>
                        This will permanently delete all {clearStats?.count.toLocaleString() || 0} power reading records.
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="rounded-lg bg-destructive/10 p-4 text-sm">
                      <p className="font-medium text-destructive">Warning:</p>
                      <ul className="mt-2 list-disc list-inside text-muted-foreground">
                        <li>All historical power data will be lost</li>
                        <li>Charts and reports will show no data</li>
                        <li>This cannot be recovered</li>
                      </ul>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowClearDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => clearReadingsMutation.mutate()}
                        disabled={clearReadingsMutation.isPending}
                      >
                        {clearReadingsMutation.isPending ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete All Data
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {clearReadingsMutation.isError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {clearReadingsMutation.error?.message}
                    </AlertDescription>
                  </Alert>
                )}

                {clearReadingsMutation.isSuccess && (
                  <Alert className="mt-4 border-green-500 bg-green-50 dark:bg-green-950">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      Successfully cleared all power readings
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
