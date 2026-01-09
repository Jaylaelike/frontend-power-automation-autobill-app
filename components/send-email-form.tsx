'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { generateStationPDF, PowerReading } from '@/lib/pdf-generator';
import { FontLoader } from '@/lib/font-loader';
import { Mail, FileText, Send, Users, Download, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  email: string;
  ThaiName: string;
  EngName: string;
  Department: string;
  Section: string;
  image_url: string | null;
}

interface SendEmailFormProps {
  powerReadings: PowerReading[];
}

export function SendEmailForm({ powerReadings }: SendEmailFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [ccUsers, setCcUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [latestStationData, setLatestStationData] = useState<PowerReading | null>(null);
  const [loadingStationData, setLoadingStationData] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ccSearchTerm, setCcSearchTerm] = useState<string>('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    // Preload fonts to avoid delays during PDF generation
    FontLoader.preloadFonts();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else {
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
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

  const fetchLatestStationData = async (stationName: string) => {
    if (!stationName) return;
    
    setLoadingStationData(true);
    try {
      const response = await fetch(`/api/station-data/${encodeURIComponent(stationName)}`);
      if (response.ok) {
        const stationData = await response.json();
        setLatestStationData(stationData);
        toast({
          title: "Data Updated",
          description: `Latest data loaded for ${stationName}`,
        });
      } else {
        // Fallback to powerReadings data if API fails
        const fallbackData = powerReadings.find(reading => reading.stationName === stationName);
        if (fallbackData) {
          setLatestStationData(fallbackData);
        } else {
          toast({
            title: "Warning",
            description: "Could not fetch latest data, using cached data",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      // Fallback to powerReadings data
      const fallbackData = powerReadings.find(reading => reading.stationName === stationName);
      if (fallbackData) {
        setLatestStationData(fallbackData);
      }
      toast({
        title: "Warning",
        description: "Using cached data due to connection issue",
        variant: "destructive",
      });
    } finally {
      setLoadingStationData(false);
    }
  };

  const importUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/users', { method: 'POST' });
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: result.message,
        });
        await fetchUsers();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
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

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.ThaiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.EngName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.Section.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.Department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCcUsers = users.filter(user => 
    user.ThaiName.toLowerCase().includes(ccSearchTerm.toLowerCase()) ||
    user.EngName.toLowerCase().includes(ccSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(ccSearchTerm.toLowerCase()) ||
    user.Section.toLowerCase().includes(ccSearchTerm.toLowerCase()) ||
    user.Department.toLowerCase().includes(ccSearchTerm.toLowerCase())
  );

  // Helper function to get user initials for avatar fallback
  const getUserInitials = (user: User) => {
    const thaiInitial = user.ThaiName.charAt(0);
    const engInitial = user.EngName.charAt(0);
    return thaiInitial || engInitial || user.email.charAt(0).toUpperCase();
  };

  const generatePDF = async () => {
    if (!selectedStation) {
      toast({
        title: "Error",
        description: "Please select a station first",
        variant: "destructive",
      });
      return;
    }

    // Always use the latest station data if available, otherwise fetch it
    let stationData = latestStationData;
    if (!stationData) {
      // Try to get from powerReadings as fallback
      stationData = powerReadings.find(reading => reading.stationName === selectedStation) || null;
      if (!stationData) {
        toast({
          title: "Error",
          description: "Station data not found. Please refresh the data.",
          variant: "destructive",
        });
        return;
      }
    }

    setGeneratingPdf(true);
    try {
      // Generate fresh PDF with current timestamp
      console.log('Generating PDF for download - station:', stationData.stationName, 'at', new Date().toISOString());
      
      // Check if fonts are available
      if (!FontLoader.isFontCached('/font/Sarabun-Regular.ttf')) {
        console.log('Fonts not cached, preloading...');
        await FontLoader.preloadFonts();
      }
      
      const pdfBytes = await generateStationPDF(stationData);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedStation}_power_report_${new Date().toISOString().split('T')[0]}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const sendEmail = async () => {
    if (!selectedStation) {
      toast({
        title: "Error",
        description: "Please select a station",
        variant: "destructive",
      });
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one recipient",
        variant: "destructive",
      });
      return;
    }

    // Always use the latest station data if available
    let stationData = latestStationData;
    if (!stationData) {
      // Try to get from powerReadings as fallback
      stationData = powerReadings.find(reading => reading.stationName === selectedStation) || null;
      if (!stationData) {
        toast({
          title: "Error",
          description: "Station data not found. Please refresh the data.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      // Show progress for PDF generation
      toast({
        title: "Generating PDF",
        description: "Creating PDF report for email attachment...",
      });

      // Generate fresh PDF for attachment with current timestamp
      console.log('Generating PDF for station:', stationData.stationName, 'at', new Date().toISOString());
      
      // Ensure fonts are loaded before PDF generation
      if (!FontLoader.isFontCached('/font/Sarabun-Regular.ttf')) {
        console.log('Fonts not cached, preloading...');
        await FontLoader.preloadFonts();
      }
      
      const pdfBytes = await generateStationPDF(stationData);
      
      // Convert PDF bytes to base64 safely
      let pdfBase64: string;
      try {
        // Method 1: Use FileReader (more reliable for large files)
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        pdfBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix to get just the base64 string
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (blobError) {
        // Fallback method: Convert in chunks to avoid call stack overflow
        console.log('Using fallback base64 conversion method');
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
        userTo: selectedUsers,
        cc: ccUsers,
        pdfAttachment: pdfBase64
      };

      const response = await fetch('/api/sendmails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Email sent successfully!",
        });
        // Reset form
        setSelectedUsers([]);
        setCcUsers([]);
        setSelectedStation('');
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Power Meter Report
          </CardTitle>
          <CardDescription>
            Select a station and recipients to send power meter reports via email with PDF attachment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Management */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">User Management</span>
            </div>
            <Button onClick={importUsers} disabled={loadingUsers} variant="outline" size="sm">
              {loadingUsers ? "Loading..." : "Import Users from CSV"}
            </Button>
          </div>

          {/* Station Selection */}
          <div className="space-y-2">
            <Label htmlFor="station">Select Station</Label>
            <Select value={selectedStation} onValueChange={(value) => {
              setSelectedStation(value);
              // Clear previous station data to ensure fresh fetch
              setLatestStationData(null);
              fetchLatestStationData(value);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a station..." />
              </SelectTrigger>
              <SelectContent>
                {powerReadings.map((reading) => (
                  <SelectItem key={reading.stationName} value={reading.stationName}>
                    {reading.stationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Latest Station Data Display */}
          {selectedStation && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Latest Station Data</Label>
                <Button 
                  onClick={() => fetchLatestStationData(selectedStation)} 
                  variant="outline" 
                  size="sm"
                  disabled={loadingStationData}
                >
                  {loadingStationData ? "Refreshing..." : "Refresh Data"}
                </Button>
              </div>
              
              {loadingStationData ? (
                <div className="border rounded-md p-4 bg-muted/50">
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading latest station data...</span>
                    </div>
                  </div>
                </div>
              ) : latestStationData ? (
                <div className="border rounded-md p-4 bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-green-600">✓ Latest data loaded</span>
                    <span className="text-xs text-muted-foreground">
                      Fetched: {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Station:</span> {latestStationData.stationName}
                    </div>
                    <div>
                      <span className="font-medium">Last Update:</span> {new Date(latestStationData.lastUpdate).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Total Power:</span> {latestStationData.totalMuxPower.toFixed(2)} kWh
                    </div>
                    <div>
                      <span className="font-medium">MUX 1:</span> {latestStationData.muxPower1.toFixed(2)} kWh
                    </div>
                    <div>
                      <span className="font-medium">MUX 2:</span> {latestStationData.muxPower2.toFixed(2)} kWh
                    </div>
                    <div>
                      <span className="font-medium">MUX 3:</span> {latestStationData.muxPower3.toFixed(2)} kWh
                    </div>
                    <div>
                      <span className="font-medium">MUX 4:</span> {latestStationData.muxPower4.toFixed(2)} kWh
                    </div>
                    <div>
                      <span className="font-medium">MUX 5:</span> {latestStationData.muxPower5.toFixed(2)} kWh
                    </div>
                    <div>
                      <span className="font-medium">MUX 6:</span> {latestStationData.muxPower6.toFixed(2)} kWh
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-md p-4 bg-muted/50">
                  <div className="flex items-center justify-center py-4">
                    <span className="text-sm text-muted-foreground">No station data available</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDF Preview/Download */}
          {selectedStation && latestStationData && (
            <div className="flex items-center gap-2">
              <Button 
                onClick={generatePDF} 
                variant="outline" 
                size="sm"
                disabled={generatingPdf}
              >
                <Download className="h-4 w-4 mr-2" />
                {generatingPdf ? "Generating PDF..." : "Download PDF Report"}
              </Button>
              <span className="text-xs text-muted-foreground">
                PDF will be generated with latest data
              </span>
              <Button 
                onClick={() => {
                  const status = FontLoader.getFontStatus();
                  console.log('Font Status:', status);
                  toast({
                    title: "Font Status",
                    description: `Regular: ${status['Sarabun-Regular'] ? '✓' : '✗'}, Bold: ${status['Sarabun-Bold'] ? '✓' : '✗'}, Medium: ${status['Sarabun-Medium'] ? '✓' : '✗'}`,
                  });
                }}
                variant="ghost" 
                size="sm"
                className="text-xs"
              >
                Check Fonts
              </Button>
            </div>
          )}

          {/* Recipients */}
          <div className="space-y-4">
            <Label>Select Recipients (To:)</Label>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipients by name, email, section, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border rounded-md p-4 space-y-2">
              {loadingUsers ? (
                <p className="text-sm text-muted-foreground">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found. Please import users first.</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users match your search criteria.</p>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.email)}
                      onCheckedChange={(checked) => handleUserSelection(user.email, checked as boolean)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user.image_url || undefined} 
                        alt={user.ThaiName || user.EngName}
                      />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <Label htmlFor={`user-${user.id}`} className="text-sm flex-1 cursor-pointer">
                      <div className="flex flex-col">
                        <span className="font-medium">{user.ThaiName}</span>
                        <span className="text-muted-foreground text-xs">
                          {user.email} • {user.Section}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CC Recipients */}
          <div className="space-y-4">
            <Label>Select CC Recipients (Optional)</Label>
            
            {/* CC Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search CC recipients by name, email, section, or department..."
                value={ccSearchTerm}
                onChange={(e) => setCcSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border rounded-md p-4 space-y-2">
              {filteredCcUsers.length === 0 && ccSearchTerm ? (
                <p className="text-sm text-muted-foreground">No users match your search criteria.</p>
              ) : (
                filteredCcUsers.map((user) => (
                  <div key={`cc-${user.id}`} className="flex items-center space-x-3">
                    <Checkbox
                      id={`cc-user-${user.id}`}
                      checked={ccUsers.includes(user.email)}
                      onCheckedChange={(checked) => handleCcSelection(user.email, checked as boolean)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user.image_url || undefined} 
                        alt={user.ThaiName || user.EngName}
                      />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <Label htmlFor={`cc-user-${user.id}`} className="text-sm flex-1 cursor-pointer">
                      <div className="flex flex-col">
                        <span className="font-medium">{user.ThaiName}</span>
                        <span className="text-muted-foreground text-xs">
                          {user.email} • {user.Section}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Send Button */}
          <div className="flex justify-end">
            <Button onClick={sendEmail} disabled={isLoading} className="min-w-32">
              {isLoading ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}