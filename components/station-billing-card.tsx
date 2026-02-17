"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Receipt, Zap, AlertCircle, Calendar } from "lucide-react";
import {
    DEFAULT_BILLING_CONFIG,
    formatCurrency,
    formatKwh,
    getThaiMonthName,
    gregorianToBe,
} from "@/lib/billing-calculator";

interface StationBillingCardProps {
    stationId: string;
    stationName: string;
}

interface ChannelBilling {
    muxChannel: number;
    customerName: string;
    previousReadDate: string;
    previousMeterReading: number;
    latestReadDate: string;
    latestMeterReading: number;
    consumption: number;
    tariff: number;
    billAmount: number;
}

interface StationBillingResponse {
    stationName: string;
    period: { month: number; year: number };
    channels: ChannelBilling[];
    totals: {
        subtotal: number;
        vatRate: number;
        vatAmount: number;
        netTotal: number;
        totalConsumption: number;
    };
    message?: string;
}

export function StationBillingCard({ stationId, stationName }: StationBillingCardProps) {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(gregorianToBe(now.getFullYear()));

    const { data, isLoading, error } = useQuery<StationBillingResponse>({
        queryKey: ["station-billing", stationId, selectedMonth, selectedYear],
        queryFn: async () => {
            const params = new URLSearchParams({
                month: String(selectedMonth),
                year: String(selectedYear),
            });
            const response = await fetch(`/api/station/${stationId}/billing?${params}`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to fetch billing data");
            }
            return response.json();
        },
        enabled: !!stationId,
    });

    const channels = data?.channels || [];
    const totals = data?.totals;
    const isSpecialTariff = channels.length > 0 && channels[0].tariff > DEFAULT_BILLING_CONFIG.defaultTariff;

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

    return (
        <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                            <Receipt className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base">ค่าไฟฟ้าประจำเดือน</CardTitle>
                            <CardDescription className="text-xs">คำนวณค่าใช้บริการกระแสไฟฟ้า แยกตามช่อง MUX</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                            <SelectTrigger className="w-[130px] h-8 text-xs">
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
                        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                            <SelectTrigger className="w-[90px] h-8 text-xs">
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
                </div>
                {isSpecialTariff && (
                    <Badge variant="outline" className="w-fit text-[10px] border-amber-500/50 text-amber-600 dark:text-amber-400 mt-1">
                        อัตราพิเศษ {channels[0].tariff.toFixed(2)} บาท/kWh
                    </Badge>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                {isLoading && (
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error instanceof Error ? error.message : "เกิดข้อผิดพลาด"}
                        </AlertDescription>
                    </Alert>
                )}

                {!isLoading && !error && channels.length === 0 && data?.message && (
                    <Alert className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                            {data.message}
                        </AlertDescription>
                    </Alert>
                )}

                {!isLoading && channels.length > 0 && (
                    <>
                        {/* Per-Channel Billing Table */}
                        <div className="space-y-2">
                            {channels.map((ch) => (
                                <div
                                    key={ch.muxChannel}
                                    className="rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors p-3 space-y-2"
                                >
                                    {/* Channel Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-mono text-[10px] border-blue-500/50 text-blue-600 dark:text-blue-400">
                                                MUX#{ch.muxChannel}
                                            </Badge>
                                            <Badge variant="secondary" className="font-mono text-[10px]">
                                                {ch.customerName}
                                            </Badge>
                                        </div>
                                        <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(ch.billAmount)} บาท
                                        </span>
                                    </div>
                                    {/* Channel Details */}
                                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                                        <div>
                                            <p className="text-muted-foreground flex items-center gap-0.5">
                                                <Calendar className="h-2.5 w-2.5" /> PMR
                                            </p>
                                            <p className="font-mono font-medium">{formatKwh(ch.previousMeterReading)}</p>
                                            <p className="text-muted-foreground text-[9px]">{formatDateTime(ch.previousReadDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground flex items-center gap-0.5">
                                                <Calendar className="h-2.5 w-2.5" /> LMR
                                            </p>
                                            <p className="font-mono font-medium">{formatKwh(ch.latestMeterReading)}</p>
                                            <p className="text-muted-foreground text-[9px]">{formatDateTime(ch.latestReadDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground flex items-center gap-0.5">
                                                <Zap className="h-2.5 w-2.5" /> หน่วย
                                            </p>
                                            <p className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                                                {formatKwh(ch.consumption)} kWh
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        {totals && (
                            <>
                                <Separator />

                                {/* Total Consumption */}
                                <div className="flex items-center justify-between rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 p-3">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm font-medium">รวมหน่วยที่ใช้</span>
                                    </div>
                                    <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                                        {formatKwh(totals.totalConsumption)} <span className="text-xs font-normal">kWh</span>
                                    </span>
                                </div>

                                {/* Billing Summary */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">ค่าบริการพลังงานไฟฟ้า ({channels.length} ช่อง)</span>
                                        <span className="font-mono font-semibold">{formatCurrency(totals.subtotal)} บาท</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">VAT 7%</span>
                                        <span className="font-mono">{formatCurrency(totals.vatAmount)} บาท</span>
                                    </div>
                                </div>

                                <Separator />

                                {/* Net Total */}
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">ยอดสุทธิ</span>
                                    <span className="font-mono text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                        {formatCurrency(totals.netTotal)} บาท
                                    </span>
                                </div>
                            </>
                        )}
                    </>
                )}

                {!isLoading && !error && channels.length === 0 && !data?.message && (
                    <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                        <Receipt className="h-8 w-8 opacity-40" />
                        <p className="text-sm">เลือกเดือน/ปี เพื่อคำนวณค่าไฟฟ้า</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
