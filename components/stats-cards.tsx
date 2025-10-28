"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Zap, TrendingUp, Database } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

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

  const stats = [
    {
      title: "Total Stations",
      value: totalStations,
      description: `${activeStations} active stations`,
      icon: Database,
      color: "text-chart-1",
    },
    {
      title: "Active Stations",
      value: activeStations,
      description: "Currently reporting",
      icon: Activity,
      color: "text-chart-3",
    },
    {
      title: "Total Active Power",
      value: `${(totalActivePower / 1000).toFixed(2)} kW`,
      description: "Combined active power",
      icon: Zap,
      color: "text-chart-2",
    },
    {
      title: "Total MUX Power",
      value: `${totalMuxPower.toFixed(2)} kWh`,
      description: "Combined MUX readings",
      icon: TrendingUp,
      color: "text-chart-4",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border/50 bg-card/50 backdrop-blur transition-all hover:bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
