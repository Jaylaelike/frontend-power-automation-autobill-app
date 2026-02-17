"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
} from "@tanstack/react-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Calculator,
    Download,
    FileDown,
    FileText,
    AlertCircle,
    TrendingUp,
    Zap,
    Receipt,
    ArrowUpDown,
    Loader2,
    Users,
} from "lucide-react";
import { generateBillingPDF } from "@/lib/billing-pdf-generator";
import {
    DEFAULT_BILLING_CONFIG,
    TARGET_STATIONS,
    MUX_CUSTOMER_MAPPINGS,
    CUSTOMER_NAME_ALIASES,
    formatCurrency,
    formatKwh,
    formatBillingPeriod,
    gregorianToBe,
    getThaiMonthName,
} from "@/lib/billing-calculator";
import type { BillingEntry, BillingSummary, BillingPeriod } from "@/lib/types/billing";

// Helper to format date as DD/MM/YYYY , HH:mm:ss
const formatDateTime = (isoString: string) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year} , ${hours}:${minutes}:${seconds}`;
};

export function BillingCalculatePage() {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(gregorianToBe(now.getFullYear()));
    const [defaultTariff, setDefaultTariff] = useState(DEFAULT_BILLING_CONFIG.defaultTariff);
    const [isLoading, setIsLoading] = useState(false);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [billingData, setBillingData] = useState<BillingSummary | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

    // Active display data
    const displayData = useMemo<BillingSummary>(
        () => billingData || {
            entries: [],
            subtotal: 0,
            vatRate: 0.07,
            vatAmount: 0,
            netTotal: 0,
            period: { month: selectedMonth, year: selectedYear },
            customerName: DEFAULT_BILLING_CONFIG.customerName,
        },
        [billingData, selectedMonth, selectedYear]
    );

    // Fetch billing data from API
    const handleCalculate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setBillingData(null);       // Reset previous results

        try {
            const response = await fetch("/api/billing/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    month: selectedMonth,
                    year: selectedYear,
                    tariffOverride: defaultTariff !== DEFAULT_BILLING_CONFIG.defaultTariff ? defaultTariff : undefined,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to calculate billing");
            }

            const data = await response.json();

            if (data.summary.entries.length === 0) {
                setError("ไม่พบข้อมูลในช่วงเวลาที่เลือก — กรุณาเลือกเดือน/ปีอื่น");
            } else {
                setBillingData(data.summary);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการคำนวณ — กรุณาลองอีกครั้ง");
        } finally {
            setIsLoading(false);
        }
    }, [selectedMonth, selectedYear, defaultTariff]);

    // Auto-calculate on mount
    useEffect(() => {
        handleCalculate();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // CSV Export
    const handleExportCSV = () => {
        const data = displayData;
        const headers = [
            "ลำดับ", "สถานี", "ลูกค้า", "MUX",
            "ว/ด/ป ที่อ่าน ครั้งก่อน", "ค่ากระแสไฟฟ้าที่จด (ครั้งก่อน) KWH",
            "ว/ด/ป ที่อ่าน ครั้งหลังสุด", "ค่ากระแสไฟฟ้าที่จด (ครั้งหลังสุด) KWH",
            "หน่วย KWH ที่ใช้", "ค่าพลังงาน KWH ละ (บาท)", "คิดเป็นจำนวนเงิน (บาท)",
        ];

        const rows = data.entries.map((e) => [
            e.index,
            e.stationNameThai,
            e.customerName || '',
            e.muxChannel ? `MUX#${e.muxChannel}` : '',
            e.previousReadDate,
            e.previousMeterReading.toFixed(3),
            e.latestReadDate,
            e.latestMeterReading.toFixed(3),
            e.consumption.toFixed(3),
            e.tariff.toFixed(2),
            e.billAmount.toFixed(2),
        ]);

        // Add summary rows
        rows.push([]);
        rows.push(["", "", "", "", "", "", "รวมค่าบริการพลังงานไฟฟ้า ทั้งสิ้น", "", data.subtotal.toFixed(2)]);
        rows.push(["", "", "", "", "", "", "VAT 7%", "", data.vatAmount.toFixed(2)]);
        rows.push(["", "", "", "", "", "", "รวมยอดสุทธิ", "", data.netTotal.toFixed(2)]);

        const csvContent = [
            `ค่าใช้บริการกระแสไฟฟ้า สำหรับ ${data.customerName}`,
            `${formatBillingPeriod(data.period)}`,
            "",
            headers.join(","),
            ...rows.map((r: any) => r.join(",")),
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `billing_${data.period.month}_${data.period.year}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // PDF Export

    const handleExportPDF = async () => {
        setIsPdfLoading(true);
        try {
            // Create a summary object based on filtered data
            const filteredSummary: BillingSummary = {
                ...displayData,
                entries: filteredEntries, // Use filtered entries
                subtotal: filteredSubtotal,
                vatAmount: filteredVat,
                netTotal: filteredNet,
                customerName: selectedCustomer || displayData.customerName, // Use selected customer if filtered
            };

            const pdfBytes = await generateBillingPDF(filteredSummary);
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `billing_${displayData.period.month}_${displayData.period.year}${selectedCustomer ? `_${selectedCustomer}` : ''}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("PDF generation failed:", err);
            setError("ไม่สามารถสร้างไฟล์ PDF ได้ — กรุณาลองอีกครั้ง");
        } finally {
            setIsPdfLoading(false);
        }
    };

    // Table columns
    const columns = useMemo<ColumnDef<BillingEntry>[]>(
        () => [
            {
                accessorKey: "index",
                header: () => <div className="text-center font-semibold">ลำดับ</div>,
                cell: ({ row }) => <div className="text-center text-muted-foreground">{row.getValue("index")}</div>,
                size: 60,
            },
            {
                accessorKey: "stationNameThai",
                header: ({ column }) => (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="gap-1 font-semibold">
                        สถานี <ArrowUpDown className="h-3 w-3" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="font-medium">
                        {row.getValue("stationNameThai")}
                        {row.original.tariff > DEFAULT_BILLING_CONFIG.defaultTariff && (
                            <Badge variant="outline" className="ml-2 text-[10px] border-amber-500/50 text-amber-600 dark:text-amber-400">
                                อัตราพิเศษ
                            </Badge>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "customerName",
                header: () => <div className="text-center font-semibold text-xs">ลูกค้า</div>,
                cell: ({ row }) => {
                    const name = row.getValue("customerName") as string;
                    return name ? (
                        <Badge variant="secondary" className="font-mono text-[10px]">
                            {name}
                        </Badge>
                    ) : null;
                },
                size: 100,
            },
            {
                accessorKey: "muxChannel",
                header: () => <div className="text-center font-semibold text-xs">MUX</div>,
                cell: ({ row }) => {
                    const ch = row.getValue("muxChannel") as number | undefined;
                    return ch ? (
                        <Badge variant="outline" className="font-mono text-[10px] border-blue-500/50 text-blue-600 dark:text-blue-400">
                            MUX#{ch}
                        </Badge>
                    ) : null;
                },
                size: 80,
            },

            // ... columns definition
            {
                accessorKey: "previousReadDate",
                header: () => <div className="text-center font-semibold text-xs">ว/ด/ป ครั้งก่อน</div>,
                cell: ({ row }) => <div className="text-center text-xs text-muted-foreground">{formatDateTime(row.getValue("previousReadDate"))}</div>,
            },
            {
                accessorKey: "previousMeterReading",
                header: ({ column }) => (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="gap-1 font-semibold text-xs">
                        PMR (KWH) <ArrowUpDown className="h-3 w-3" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="text-right font-mono text-sm">
                        {formatKwh(row.getValue("previousMeterReading"))}
                    </div>
                ),
            },
            {
                accessorKey: "latestReadDate",
                header: () => <div className="text-center font-semibold text-xs">ว/ด/ป ครั้งหลังสุด</div>,
                cell: ({ row }) => <div className="text-center text-xs text-muted-foreground">{formatDateTime(row.getValue("latestReadDate"))}</div>,
            },
            {
                accessorKey: "latestMeterReading",
                header: ({ column }) => (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="gap-1 font-semibold text-xs">
                        LMR (KWH) <ArrowUpDown className="h-3 w-3" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="text-right font-mono text-sm">
                        {formatKwh(row.getValue("latestMeterReading"))}
                    </div>
                ),
            },
            {
                accessorKey: "consumption",
                header: ({ column }) => (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="gap-1 font-semibold text-xs">
                        หน่วย KWH <ArrowUpDown className="h-3 w-3" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const val = row.getValue("consumption") as number;
                    return (
                        <div className="text-right font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {formatKwh(val)}
                        </div>
                    );
                },
            },
            {
                accessorKey: "tariff",
                header: () => <div className="text-center font-semibold text-xs">ค่าพลังงาน/KWH</div>,
                cell: ({ row }) => {
                    const tariff = row.getValue("tariff") as number;
                    const isSpecial = tariff > DEFAULT_BILLING_CONFIG.defaultTariff;
                    return (
                        <div className={`text-center font-mono text-sm ${isSpecial ? "text-amber-600 dark:text-amber-400 font-bold" : ""}`}>
                            {tariff.toFixed(2)} บาท
                        </div>
                    );
                },
            },
            {
                accessorKey: "billAmount",
                header: ({ column }) => (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="gap-1 font-semibold text-xs">
                        จำนวนเงิน (บาท) <ArrowUpDown className="h-3 w-3" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="text-right font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(row.getValue("billAmount"))}
                    </div>
                ),
            },
        ],
        []
    );

    // Unique customer names for filter tabs
    const uniqueCustomers = useMemo(() => {
        const names = new Set<string>();
        displayData.entries.forEach((e) => {
            if (e.customerName) names.add(e.customerName);
        });
        return Array.from(names).sort();
    }, [displayData.entries]);

    // Filtered entries based on selected customer
    const filteredEntries = useMemo(() => {
        if (!selectedCustomer) return displayData.entries;
        return displayData.entries.filter((e) => e.customerName === selectedCustomer);
    }, [displayData.entries, selectedCustomer]);

    const table = useReactTable({
        data: filteredEntries,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: { sorting },
    });

    // Summary stats (from filtered entries)
    const totalStations = filteredEntries.length;
    const totalConsumption = filteredEntries.reduce((sum, e) => sum + e.consumption, 0);
    const avgConsumption = totalStations > 0 ? totalConsumption / totalStations : 0;
    const filteredSubtotal = filteredEntries.reduce((sum, e) => sum + e.billAmount, 0);
    const filteredVat = Math.round(filteredSubtotal * displayData.vatRate * 100) / 100;
    const filteredNet = Math.round((filteredSubtotal + filteredVat) * 100) / 100;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                        <Receipt className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">คำนวณค่าไฟฟ้า</h1>
                        <p className="text-sm text-muted-foreground">
                            ค่าใช้บริการกระแสไฟฟ้าจากการใช้บริการสิ่งอำนวยความสะดวกด้านกระจายเสียงหรือโทรทัศน์
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-primary" />
                        ตั้งค่าการคำนวณ
                    </CardTitle>
                    <CardDescription>เลือกเดือน/ปี และอัตราค่าไฟฟ้า</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        {/* Month Selector */}
                        <div className="space-y-2 w-full sm:w-48">
                            <Label className="text-xs font-medium text-muted-foreground">เดือน</Label>
                            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                        <SelectItem key={m} value={String(m)}>
                                            {getThaiMonthName(m)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Year Selector */}
                        <div className="space-y-2 w-full sm:w-36">
                            <Label className="text-xs font-medium text-muted-foreground">ปี พ.ศ.</Label>
                            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 5 }, (_, i) => gregorianToBe(now.getFullYear()) - 2 + i).map((y) => (
                                        <SelectItem key={y} value={String(y)}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Default Tariff */}
                        <div className="space-y-2 w-full sm:w-40">
                            <Label className="text-xs font-medium text-muted-foreground">อัตราค่าไฟ (บาท/KWH)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={defaultTariff}
                                onChange={(e) => setDefaultTariff(Number(e.target.value))}
                                className="font-mono"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleCalculate}
                                disabled={isLoading}
                                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Calculator className="h-4 w-4" />
                                )}
                                คำนวณ
                            </Button>
                            <Button variant="outline" onClick={handleExportCSV} className="gap-2" disabled={displayData.entries.length === 0}>
                                <Download className="h-4 w-4" />
                                CSV
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleExportPDF}
                                className="gap-2 border-red-500/30 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                disabled={displayData.entries.length === 0 || isPdfLoading}
                            >
                                {isPdfLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <FileDown className="h-4 w-4" />
                                )}
                                PDF
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error/Info Alert */}
            {error && (
                <Alert variant={billingData ? "destructive" : "default"} className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 dark:text-amber-400">{error}</AlertDescription>
                </Alert>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">จำนวนรายการ</p>
                                <p className="text-2xl font-bold">{totalStations}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-2">
                                <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">รวมหน่วยที่ใช้ (KWH)</p>
                                <p className="text-xl font-bold font-mono">{formatKwh(totalConsumption)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2">
                                <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">รวมค่าบริการ (ก่อน VAT)</p>
                                <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(filteredSubtotal)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2">
                                <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">ยอดสุทธิ (รวม VAT 7%)</p>
                                <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{formatCurrency(filteredNet)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>



            {/* Customer Filter Tabs */}
            {uniqueCustomers.length > 0 && (
                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            กรองตามลูกค้า
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={selectedCustomer === null ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCustomer(null)}
                                className={`gap-1.5 text-xs ${selectedCustomer === null ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : ''}`}
                            >
                                ทั้งหมด
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 min-w-[20px] justify-center">
                                    {displayData.entries.length}
                                </Badge>
                            </Button>
                            {uniqueCustomers.map((name) => {
                                const count = displayData.entries.filter((e) => e.customerName === name).length;
                                const isActive = selectedCustomer === name;
                                return (
                                    <Button
                                        key={name}
                                        variant={isActive ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedCustomer(isActive ? null : name)}
                                        className={`gap-1.5 text-xs ${isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : ''}`}
                                    >
                                        {name}
                                        <Badge variant={isActive ? "secondary" : "outline"} className="text-[9px] px-1.5 py-0 h-4 min-w-[20px] justify-center">
                                            {count}
                                        </Badge>
                                    </Button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Billing Table */}
            <Card className="border-border/50 shadow-sm">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                                            {headerGroup.headers.map((header) => (
                                                <TableHead key={header.id} className="whitespace-nowrap">
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows.length > 0 ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id} className="py-2.5">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="h-32 text-center">
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Receipt className="h-8 w-8 opacity-40" />
                                                    <p>ไม่มีข้อมูลค่าไฟฟ้า</p>
                                                    <p className="text-xs">กดปุ่ม &quot;คำนวณ&quot; เพื่อเริ่มคำนวณ</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>

                {/* Summary Footer */}
                {displayData.entries.length > 0 && (
                    <div className="border-t bg-muted/20 p-4 space-y-2">
                        <div className="flex justify-between items-center px-2">
                            <span className="font-medium text-muted-foreground">รวมค่าบริการพลังงานไฟฟ้า{selectedCustomer ? ` (${selectedCustomer})` : ' ทั้งสิ้น'}</span>
                            <span className="font-bold font-mono text-lg">{formatCurrency(filteredSubtotal)} บาท</span>
                        </div>
                        <div className="flex justify-between items-center px-2">
                            <span className="font-medium text-muted-foreground">VAT 7%</span>
                            <span className="font-bold font-mono text-lg">{formatCurrency(filteredVat)} บาท</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center px-2 pt-1">
                            <span className="font-bold text-lg">รวมยอดสุทธิ</span>
                            <span className="font-bold font-mono text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                {formatCurrency(filteredNet)} บาท
                            </span>
                        </div>
                    </div>
                )}
            </Card>



            {/* Customer/MUX Mapping Reference */}
            <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        Customer / MUX Mapping Reference
                    </CardTitle>
                    <CardDescription className="text-xs">การจับคู่ช่อง MUX กับลูกค้า/ผู้ประกอบกิจการ</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {MUX_CUSTOMER_MAPPINGS.map((m) => (
                            <div key={`${m.userAlias}-${m.systemVariable}`} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                <Badge variant="outline" className="font-mono text-xs min-w-[60px] justify-center">
                                    {m.muxChannel ? `MUX#${m.muxChannel}` : m.group || "—"}
                                </Badge>
                                <div className="text-xs">
                                    <span className="font-medium">{m.userAlias}</span>
                                    <span className="text-muted-foreground"> → {m.systemVariable}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Target Stations Reference */}
            <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        Target Stations
                    </CardTitle>
                    <CardDescription className="text-xs">รายชื่อสถานีเป้าหมายในระบบ</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {TARGET_STATIONS.map((s) => (
                            <div key={s.code} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                <Badge variant="outline" className="font-mono text-xs min-w-[40px] justify-center">
                                    {s.code}
                                </Badge>
                                <div className="text-xs">
                                    <span className="font-medium">{s.thaiName}</span>
                                    <span className="text-muted-foreground"> ({s.englishName})</span>
                                </div>
                                {s.note && (
                                    <Badge variant="secondary" className="text-[9px] ml-auto">
                                        {s.note.includes("7.36") ? "7.36 ฿" : "Note"}
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
