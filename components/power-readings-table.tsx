"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Search, Eye, EyeOff, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToCSV } from "@/lib/csv-export";

interface PowerReading {
  id: string;
  stationId: string;
  timestamp: string;
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
}

interface Station {
  id: string;
  name: string;
  ipAddress: string | null;
  scene: string | null;
  latestReading: PowerReading | null;
}

interface PowerReadingsTableProps {
  data: { stations: Station[] } | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function PowerReadingsTable({
  data,
  isLoading,
  error,
}: PowerReadingsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showDetailedView, setShowDetailedView] = useState(true);

  const baseColumns: ColumnDef<Station>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 hover:bg-muted/50"
          >
            Station Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium text-foreground">{row.original.name}</div>
      ),
    },
    {
      accessorKey: "ipAddress",
      header: "IP Address",
      cell: ({ row }) => (
        <div className="font-mono text-sm text-muted-foreground">
          {row.original.ipAddress || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "timestamp",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 hover:bg-muted/50"
          >
            Last Update
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        if (!reading)
          return <span className="text-muted-foreground">No data</span>;
        const date = new Date(reading.timestamp);
        return (
          <div className="flex flex-col gap-1">
            <div className="text-sm">{date.toLocaleDateString()}</div>
            <div className="text-xs text-muted-foreground">
              {date.toLocaleTimeString()}
            </div>
          </div>
        );
      },
    },
    {
      id: "activePower",
      header: "Active Power (W)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        if (!reading) return <span className="text-muted-foreground">—</span>;

        const powers = [
          reading.activePower1,
          reading.activePower2,
          reading.activePower3,
          reading.activePower4,
          reading.activePower5,
          reading.activePower6,
        ].filter((p) => p !== null);

        if (powers.length === 0)
          return <span className="text-muted-foreground">—</span>;

        const total = powers.reduce((sum, p) => sum + (p || 0), 0);
        return (
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-chart-1">{total.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              {powers.length} sensors
            </div>
          </div>
        );
      },
    },
    {
      id: "muxPower",
      header: "MUX Power (kWh)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        if (!reading) return <span className="text-muted-foreground">—</span>;

        const powers = [
          reading.muxPower1,
          reading.muxPower2,
          reading.muxPower3,
          reading.muxPower4,
          reading.muxPower5,
          reading.muxPower6,
        ].filter((p) => p !== null);

        if (powers.length === 0)
          return <span className="text-muted-foreground">—</span>;

        const total = powers.reduce((sum, p) => sum + (p || 0), 0);
        return (
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-chart-2">{total.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              {powers.length} meters
            </div>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        if (!reading) {
          return (
            <Badge
              variant="outline"
              className="border-destructive/50 text-destructive"
            >
              Offline
            </Badge>
          );
        }

        const now = new Date();
        const readingTime = new Date(reading.timestamp);
        const diffMinutes = (now.getTime() - readingTime.getTime()) / 1000 / 60;

        if (diffMinutes > 5) {
          return (
            <Badge variant="outline" className="border-accent/50 text-accent">
              Stale
            </Badge>
          );
        }

        return (
          <Badge variant="outline" className="border-chart-3/50 text-chart-3">
            Active
          </Badge>
        );
      },
    },
  ];

  const detailedColumns: ColumnDef<Station>[] = [
    ...baseColumns.slice(0, 3), // Station name, IP Address, timestamp
    // Individual Active Power columns
    {
      accessorKey: "activePower1",
      header: "AP1 (W)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        const value = reading?.activePower1;
        return value !== null && value !== undefined ? (
          <span className="font-mono text-sm text-chart-1">
            {value.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "activePower2",
      header: "AP2 (W)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        const value = reading?.activePower2;
        return value !== null && value !== undefined ? (
          <span className="font-mono text-sm text-chart-1">
            {value.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "activePower3",
      header: "AP3 (W)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        const value = reading?.activePower3;
        return value !== null && value !== undefined ? (
          <span className="font-mono text-sm text-chart-1">
            {value.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "activePower4",
      header: "AP4 (W)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        const value = reading?.activePower4;
        return value !== null && value !== undefined ? (
          <span className="font-mono text-sm text-chart-1">
            {value.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "activePower5",
      header: "AP5 (W)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        const value = reading?.activePower5;
        return value !== null && value !== undefined ? (
          <span className="font-mono text-sm text-chart-1">
            {value.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "activePower6",
      header: "AP6 (W)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        const value = reading?.activePower6;
        return value !== null && value !== undefined ? (
          <span className="font-mono text-sm text-chart-1">
            {value.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    // Individual MUX Power columns
    {
      accessorKey: "muxPower1",
      header: "MUX1 (kWh)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        const value = reading?.muxPower1;
        return value !== null && value !== undefined ? (
          <span className="font-mono text-sm text-chart-2">
            {value.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "muxPower2",
      header: "MUX2 (kWh)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        const value = reading?.muxPower2;
        return value !== null && value !== undefined ? (
          <span className="font-mono text-sm text-chart-2">
            {value.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "muxPower3",
      header: "MUX3 (kWh)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        const value = reading?.muxPower3;
        return value !== null && value !== undefined ? (
          <span className="font-mono text-sm text-chart-2">
            {value.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "muxPower4",
      header: "MUX4 (kWh)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        const value = reading?.muxPower4;
        return value !== null && value !== undefined ? (
          <span className="font-mono text-sm text-chart-2">
            {value.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "muxPower5",
      header: "MUX5 (kWh)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        const value = reading?.muxPower5;
        return value !== null && value !== undefined ? (
          <span className="font-mono text-sm text-chart-2">
            {value.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "muxPower6",
      header: "MUX6 (kWh)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        const value = reading?.muxPower6;
        return value !== null && value !== undefined ? (
          <span className="font-mono text-sm text-chart-2">
            {value.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    // Summary columns
    {
      id: "activePowerTotal",
      header: "AP Total (W)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        if (!reading) return <span className="text-muted-foreground">—</span>;

        const powers = [
          reading.activePower1,
          reading.activePower2,
          reading.activePower3,
          reading.activePower4,
          reading.activePower5,
          reading.activePower6,
        ].filter((p) => p !== null && p !== undefined);

        if (powers.length === 0)
          return <span className="text-muted-foreground">—</span>;

        const total = powers.reduce((sum, p) => sum + (p || 0), 0);
        return (
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-chart-1">{total.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              {powers.length} active
            </div>
          </div>
        );
      },
    },
    {
      id: "muxPowerTotal",
      header: "MUX Total (kWh)",
      cell: ({ row }) => {
        const reading = row.original.latestReading;
        if (!reading) return <span className="text-muted-foreground">—</span>;

        const powers = [
          reading.muxPower1,
          reading.muxPower2,
          reading.muxPower3,
          reading.muxPower4,
          reading.muxPower5,
          reading.muxPower6,
        ].filter((p) => p !== null && p !== undefined);

        if (powers.length === 0)
          return <span className="text-muted-foreground">—</span>;

        const total = powers.reduce((sum, p) => sum + (p || 0), 0);
        return (
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-chart-2">{total.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              {powers.length} active
            </div>
          </div>
        );
      },
    },
    baseColumns[baseColumns.length - 1], // Status column
  ];

  const columns = showDetailedView ? detailedColumns : baseColumns;

  const table = useReactTable({
    data: data?.stations || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  });

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Error loading data
          </p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search stations..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportToCSV(data?.stations || [], 'power-readings')}
            className="gap-2"
            disabled={!data?.stations || data.stations.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDetailedView(!showDetailedView)}
            className="gap-2"
          >
            {showDetailedView ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {showDetailedView ? "Summary View" : "Detailed View"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/50 bg-background/30 overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-border/50 hover:bg-muted/30"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-muted-foreground whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-border/50 transition-colors hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="text-muted-foreground">
                    No stations found.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {table.getRowModel().rows.length} of{" "}
          {data?.stations.length || 0} stations
        </div>
        <div className="flex items-center gap-4">
          <span>View: {showDetailedView ? "Detailed" : "Summary"}</span>
          <span>Auto-refresh: 30 seconds</span>
        </div>
      </div>
    </div>
  );
}
