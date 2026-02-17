"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Calculator,
    RefreshCw,
    Zap,
    Coins,
    FileText
} from "lucide-react";
import {
    calculateConsumption,
    calculateBill,
    DEFAULT_BILLING_CONFIG,
    formatCurrency,
    formatKwh,
    CUSTOMER_NAME_ALIASES,
} from "@/lib/billing-calculator";

export default function ManualBillingTestPage() {
    // Inputs
    const [customerName, setCustomerName] = useState("");
    const [pmr, setPmr] = useState<string>("");
    const [lmr, setLmr] = useState<string>("");
    const [tariff, setTariff] = useState<string>(DEFAULT_BILLING_CONFIG.defaultTariff.toString());

    // Outputs
    const [consumption, setConsumption] = useState<number | null>(null);
    const [energyCharge, setEnergyCharge] = useState<number | null>(null);
    const [vat, setVat] = useState<number | null>(null);
    const [netTotal, setNetTotal] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Calculate whenever inputs change
    useEffect(() => {
        calculate();
    }, [pmr, lmr, tariff]);

    const calculate = () => {
        setError(null);

        const pmrVal = parseFloat(pmr);
        const lmrVal = parseFloat(lmr);
        const tariffVal = parseFloat(tariff);

        if (isNaN(pmrVal) || isNaN(lmrVal) || isNaN(tariffVal)) {
            resetOutputs();
            return;
        }

        try {
            // 1. Consumption
            const cons = calculateConsumption(pmrVal, lmrVal);
            setConsumption(cons);

            // 2. Energy Charge
            const bill = calculateBill(cons, tariffVal);
            setEnergyCharge(bill);

            // 3. VAT (7%)
            const vatAmount = bill * 0.07;
            setVat(vatAmount);

            // 4. Net Total
            const total = bill + vatAmount;
            setNetTotal(total);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Calculation error");
            resetOutputs();
        }
    };

    const resetOutputs = () => {
        setConsumption(null);
        setEnergyCharge(null);
        setVat(null);
        setNetTotal(null);
    };

    const handleReset = () => {
        setCustomerName("");
        setPmr("");
        setLmr("");
        setTariff(DEFAULT_BILLING_CONFIG.defaultTariff.toString());
        resetOutputs();
        setError(null);
    };

    // Quick fill helper for testing
    const fillExample = () => {
        setCustomerName("Test Customer");
        setPmr("1000");
        setLmr("1500");
        setTariff("6.5");
        // Trigger calculation (via useEffect)
    };

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <Calculator className="h-8 w-8 text-primary" />
                Manual Billing Tester
            </h1>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Input Data</CardTitle>
                        <CardDescription>
                            Enter meter readings to verify calculation formulas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customer">Customer Name (Optional)</Label>
                                <Input
                                    id="customer"
                                    placeholder="e.g. PRD, MCOT"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tariff">Tariff (Baht/Unit)</Label>
                                <Input
                                    id="tariff"
                                    type="number"
                                    step="0.01"
                                    value={tariff}
                                    onChange={(e) => setTariff(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pmr">Previous Meter Reading (PMR)</Label>
                                <div className="relative">
                                    <Input
                                        id="pmr"
                                        type="number"
                                        step="0.001"
                                        placeholder="0.000"
                                        value={pmr}
                                        onChange={(e) => setPmr(e.target.value)}
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">KWH</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lmr">Latest Meter Reading (LMR)</Label>
                                <div className="relative">
                                    <Input
                                        id="lmr"
                                        type="number"
                                        step="0.001"
                                        placeholder="0.000"
                                        value={lmr}
                                        onChange={(e) => setLmr(e.target.value)}
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">KWH</span>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm font-medium border border-red-200">
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={handleReset} className="w-full">
                                <RefreshCw className="mr-2 h-4 w-4" /> Reset
                            </Button>
                            <Button variant="secondary" onClick={fillExample} className="w-full">
                                <FileText className="mr-2 h-4 w-4" /> Load Example
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`transition-opacity duration-200 ${consumption !== null ? "border-primary/50 shadow-md opacity-100" : "opacity-50"}`}>
                    <CardHeader className="bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Calculation Results
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">

                        {/* Consumption */}
                        <div className="flex justify-between items-center text-lg">
                            <span className="text-muted-foreground">Consumption (Units)</span>
                            <span className="font-mono font-semibold text-xl">
                                {consumption !== null ? formatKwh(consumption) : "-"}
                            </span>
                        </div>

                        <Separator />

                        {/* Financials */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span>Energy Charge ({tariff} B/Unit)</span>
                                <span className="font-mono text-lg">
                                    {energyCharge !== null ? formatCurrency(energyCharge) : "-"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-muted-foreground">
                                <span>VAT (7%)</span>
                                <span className="font-mono">
                                    {vat !== null ? formatCurrency(vat) : "-"}
                                </span>
                            </div>

                            <Separator className="my-2" />

                            <div className="flex justify-between items-center text-xl font-bold text-primary">
                                <span>Net Total</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-mono text-2xl">
                                        {netTotal !== null ? formatCurrency(netTotal) : "-"}
                                    </span>
                                    <span className="text-sm font-normal text-muted-foreground">Baht</span>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
