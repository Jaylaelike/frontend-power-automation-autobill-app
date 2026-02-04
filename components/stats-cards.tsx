"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Zap, TrendingUp, Database } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import CountUp from "@/components/ui/count-up"

interface StatsCardsProps {
  data: any
  isLoading: boolean
}

export function StatsCards({ data, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-2 h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stations = data?.stations || []
  const totalStations = stations.length
  const activeStations = stations.filter((s: any) => s.latestReading).length

  const totalActivePower = stations.reduce((sum: number, station: any) => {
    if (!station.latestReading) return sum
    const reading = station.latestReading
    if (reading.totalActivePower !== null && reading.totalActivePower !== undefined) {
      return sum + reading.totalActivePower
    }
    return (
      sum +
      (reading.activePower1 || 0) +
      (reading.activePower2 || 0) +
      (reading.activePower3 || 0) +
      (reading.activePower4 || 0) +
      (reading.activePower5 || 0) +
      (reading.activePower6 || 0)
    )
  }, 0)

  const totalMuxPower = stations.reduce((sum: number, station: any) => {
    if (!station.latestReading) return sum
    const reading = station.latestReading
    if (reading.totalMuxPower !== null && reading.totalMuxPower !== undefined) {
      return sum + reading.totalMuxPower
    }
    return (
      sum +
      (reading.muxPower1 || 0) +
      (reading.muxPower2 || 0) +
      (reading.muxPower3 || 0) +
      (reading.muxPower4 || 0) +
      (reading.muxPower5 || 0) +
      (reading.muxPower6 || 0)
    )
  }, 0)

  const activePowerKW = totalActivePower / 1000

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Stations */}
      <Card className="border-border/50 bg-card/50 backdrop-blur transition-all hover:bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Stations</CardTitle>
          <Database className="h-4 w-4 text-chart-1" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CountUp from={0} to={totalStations} duration={1} />
          </div>
          <p className="text-xs text-muted-foreground">
            <CountUp from={0} to={activeStations} duration={1} /> active stations
          </p>
        </CardContent>
      </Card>

      {/* Active Stations */}
      <Card className="border-border/50 bg-card/50 backdrop-blur transition-all hover:bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Stations</CardTitle>
          <Activity className="h-4 w-4 text-chart-3" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CountUp from={0} to={activeStations} duration={1} />
          </div>
          <p className="text-xs text-muted-foreground">Currently reporting</p>
        </CardContent>
      </Card>

      {/* Total Active Power */}
      <Card className="border-border/50 bg-card/50 backdrop-blur transition-all hover:bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Active Power</CardTitle>
          <Zap className="h-4 w-4 text-chart-2" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CountUp from={0} to={activePowerKW} duration={1.2} /> kW
          </div>
          <p className="text-xs text-muted-foreground">Combined active power</p>
        </CardContent>
      </Card>

      {/* Total MUX Power */}
      <Card className="border-border/50 bg-card/50 backdrop-blur transition-all hover:bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total MUX Power</CardTitle>
          <TrendingUp className="h-4 w-4 text-chart-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CountUp from={0} to={totalMuxPower} duration={1.2} /> kWh
          </div>
          <p className="text-xs text-muted-foreground">Combined MUX readings</p>
        </CardContent>
      </Card>
    </div>
  )
}
