'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { generateStationPDF, PowerReading } from '@/lib/pdf-generator';
import { FontLoader } from '@/lib/font-loader';
import { Mail, FileText, Send, Download, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StationInfo } from '@/lib/types/station';
import { StationBillingResponse } from '@/lib/types/billing';
import { gregorianToBe } from '@/lib/billing-calculator';

interface User {
  id: number;
  email: string;
  ThaiName: string;
  EngName: string;
  Department: string;
  Section: string;
  image_url: string | null;
}

interface StationReportActionsProps {
  station: StationInfo;
}

export function StationReportActions({ station }: StationReportActionsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [ccUsers, setCcUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ccSearchTerm, setCcSearchTerm] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    FontLoader.preloadFonts();
  }, []);

  const fetchUsers = async () => {
    if (users.length > 0) return;
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Get station data for PDF/email
  const getStationData = (): PowerReading | null => {
    const latestReading = station.latestReading;
    if (!latestReading) return null;

    return {
      stationName: station.name,
      lastUpdate: latestReading.timestamp,
      muxPower1: latestReading.muxPower1 || 0,
      muxPower2: latestReading.muxPower2 || 0,
      muxPower3: latestReading.muxPower3 || 0,
      muxPower4: latestReading.muxPower4 || 0,
      muxPower5: latestReading.muxPower5 || 0,
      muxPower6: latestReading.muxPower6 || 0,
      totalMuxPower: latestReading.totalMuxPower || 0,
      modbusLabel1: station.modbusConfig?.modbus1,
      modbusLabel2: station.modbusConfig?.modbus2,
      modbusLabel3: station.modbusConfig?.modbus3,
      modbusLabel4: station.modbusConfig?.modbus4,
      modbusLabel5: station.modbusConfig?.modbus5,
      modbusLabel6: station.modbusConfig?.modbus6,
    };
  };

  // Fetch billing data for report
  const fetchBillingData = async (): Promise<StationBillingResponse | undefined> => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = gregorianToBe(now.getFullYear());

      const response = await fetch(`/api/station/${station.id}/billing?month=${month}&year=${year}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch billing data for report:', error);
    }
    return undefined;
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleCcSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setCcUsers([...ccUsers, userId]);
    } else {
      setCcUsers(ccUsers.filter(id => id !== userId));
    }
  };

  const filteredUsers = users.filter(user =>
    user.ThaiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.EngName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.Section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCcUsers = users.filter(user =>
    user.ThaiName.toLowerCase().includes(ccSearchTerm.toLowerCase()) ||
    user.EngName.toLowerCase().includes(ccSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(ccSearchTerm.toLowerCase()) ||
    user.Section.toLowerCase().includes(ccSearchTerm.toLowerCase())
  );

  const getUserInitials = (user: User) => {
    return user.ThaiName.charAt(0) || user.EngName.charAt(0) || user.email.charAt(0).toUpperCase();
  };

  const generatePDF = async () => {
    const stationData = getStationData();
    if (!stationData) {
      toast({
        title: "Error",
        description: "No station data available for report",
        variant: "destructive",
      });
      return;
    }

    setGeneratingPdf(true);
    try {
      if (!FontLoader.isFontCached('/font/Sarabun-Regular.ttf')) {
        await FontLoader.preloadFonts();
      }

      const billingData = await fetchBillingData();
      const pdfBytes = await generateStationPDF(stationData, billingData);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${station.name}_power_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF report downloaded successfully",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const sendEmail = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one recipient",
        variant: "destructive",
      });
      return;
    }

    const stationData = getStationData();
    if (!stationData) {
      toast({
        title: "Error",
        description: "No station data available",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      toast({
        title: "Generating PDF",
        description: "Creating PDF report for email attachment...",
      });

      if (!FontLoader.isFontCached('/font/Sarabun-Regular.ttf')) {
        await FontLoader.preloadFonts();
      }

      const billingData = await fetchBillingData();
      const pdfBytes = await generateStationPDF(stationData, billingData);

      // Convert PDF to base64
      let pdfBase64: string;
      try {
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        pdfBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        const chunkSize = 8192;
        let binary = '';
        for (let i = 0; i < pdfBytes.length; i += chunkSize) {
          const chunk = pdfBytes.slice(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        pdfBase64 = btoa(binary);
      }

      const emailData = {
        stationName: stationData.stationName,
        lastUpdate: stationData.lastUpdate,
        muxPower1: stationData.muxPower1,
        muxPower2: stationData.muxPower2,
        muxPower3: stationData.muxPower3,
        muxPower4: stationData.muxPower4,
        muxPower5: stationData.muxPower5,
        muxPower6: stationData.muxPower6,
        totalMuxPower: stationData.totalMuxPower,
        modbusLabel1: stationData.modbusLabel1,
        modbusLabel2: stationData.modbusLabel2,
        modbusLabel3: stationData.modbusLabel3,
        modbusLabel4: stationData.modbusLabel4,
        modbusLabel5: stationData.modbusLabel5,
        modbusLabel6: stationData.modbusLabel6,
        userTo: selectedUsers,
        cc: ccUsers,
        pdfAttachment: pdfBase64
      };

      const response = await fetch('/api/sendmails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Email sent successfully!",
        });
        setSelectedUsers([]);
        setCcUsers([]);
        setDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to send email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Report & Email
        </CardTitle>
        <CardDescription>
          Generate PDF report or send email with station data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {/* Download PDF Button */}
          <Button
            onClick={generatePDF}
            variant="outline"
            disabled={generatingPdf || !station.latestReading}
          >
            {generatingPdf ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF Report
              </>
            )}
          </Button>

          {/* Send Email Dialog */}
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (open) fetchUsers();
          }}>
            <DialogTrigger asChild>
              <Button disabled={!station.latestReading}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Send Report - {station.name}
                </DialogTitle>
                <DialogDescription>
                  Select recipients to send the power meter report via email
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Station Data Preview */}
                <div className="border rounded-md p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Report Data</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Station:</span> {station.name}</div>
                    <div><span className="text-muted-foreground">Total Power:</span> {station.latestReading?.totalMuxPower?.toFixed(2) || 0} kWh</div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Last Update:</span>{' '}
                      {station.latestReading ? new Date(station.latestReading.timestamp).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Recipients */}
                <div className="space-y-3">
                  <Label>Recipients (To:)</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or section..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                    {loadingUsers ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Loading users...</p>
                    ) : filteredUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                    ) : (
                      filteredUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(user.email)}
                            onCheckedChange={(checked) => handleUserSelection(user.email, checked as boolean)}
                          />
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={user.image_url || undefined} alt={user.ThaiName} />
                            <AvatarFallback className="text-xs">{getUserInitials(user)}</AvatarFallback>
                          </Avatar>
                          <Label htmlFor={`user-${user.id}`} className="text-sm flex-1 cursor-pointer">
                            <span className="font-medium">{user.ThaiName}</span>
                            <span className="text-muted-foreground text-xs ml-2">{user.email}</span>
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedUsers.length > 0 && (
                    <p className="text-xs text-muted-foreground">{selectedUsers.length} recipient(s) selected</p>
                  )}
                </div>

                {/* CC Recipients */}
                <div className="space-y-3">
                  <Label>CC Recipients (Optional)</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search CC recipients..."
                      value={ccSearchTerm}
                      onChange={(e) => setCcSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-3 space-y-2">
                    {filteredCcUsers.map((user) => (
                      <div key={`cc-${user.id}`} className="flex items-center space-x-3">
                        <Checkbox
                          id={`cc-user-${user.id}`}
                          checked={ccUsers.includes(user.email)}
                          onCheckedChange={(checked) => handleCcSelection(user.email, checked as boolean)}
                        />
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={user.image_url || undefined} alt={user.ThaiName} />
                          <AvatarFallback className="text-xs">{getUserInitials(user)}</AvatarFallback>
                        </Avatar>
                        <Label htmlFor={`cc-user-${user.id}`} className="text-sm flex-1 cursor-pointer">
                          <span className="font-medium">{user.ThaiName}</span>
                          <span className="text-muted-foreground text-xs ml-2">{user.email}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Send Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={sendEmail} disabled={isLoading || selectedUsers.length === 0}>
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
