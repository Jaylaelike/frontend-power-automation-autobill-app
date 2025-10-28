interface Station {
  id: string
  name: string
  ipAddress: string | null
  scene: string | null
  latestReading: {
    id: string
    stationId: string
    timestamp: string
    activePower1: number | null
    activePower2: number | null
    activePower3: number | null
    activePower4: number | null
    activePower5: number | null
    activePower6: number | null
    muxPower1: number | null
    muxPower2: number | null
    muxPower3: number | null
    muxPower4: number | null
    muxPower5: number | null
    muxPower6: number | null
  } | null
}

export function exportToCSV(stations: Station[], filename: string = 'power-readings') {
  // Define CSV headers
  const headers = [
    'Station Name',
    'IP Address',
    'Scene',
    'Last Update',
    'Active Power 1 (W)',
    'Active Power 2 (W)',
    'Active Power 3 (W)',
    'Active Power 4 (W)',
    'Active Power 5 (W)',
    'Active Power 6 (W)',
    'Total Active Power (W)',
    'MUX Power 1 (kWh)',
    'MUX Power 2 (kWh)',
    'MUX Power 3 (kWh)',
    'MUX Power 4 (kWh)',
    'MUX Power 5 (kWh)',
    'MUX Power 6 (kWh)',
    'Total MUX Power (kWh)',
    'Status'
  ]

  // Convert stations data to CSV rows
  const rows = stations.map(station => {
    const reading = station.latestReading
    
    // Calculate totals
    const activePowers = reading ? [
      reading.activePower1,
      reading.activePower2,
      reading.activePower3,
      reading.activePower4,
      reading.activePower5,
      reading.activePower6,
    ].filter(p => p !== null && p !== undefined) : []
    
    const muxPowers = reading ? [
      reading.muxPower1,
      reading.muxPower2,
      reading.muxPower3,
      reading.muxPower4,
      reading.muxPower5,
      reading.muxPower6,
    ].filter(p => p !== null && p !== undefined) : []
    
    const totalActivePower = activePowers.length > 0 
      ? activePowers.reduce((sum, p) => sum + (p || 0), 0) 
      : null
    
    const totalMuxPower = muxPowers.length > 0 
      ? muxPowers.reduce((sum, p) => sum + (p || 0), 0) 
      : null

    // Determine status
    let status = 'Offline'
    if (reading) {
      const now = new Date()
      const readingTime = new Date(reading.timestamp)
      const diffMinutes = (now.getTime() - readingTime.getTime()) / 1000 / 60
      
      if (diffMinutes <= 5) {
        status = 'Active'
      } else {
        status = 'Stale'
      }
    }

    return [
      station.name,
      station.ipAddress || 'N/A',
      station.scene || 'N/A',
      reading ? new Date(reading.timestamp).toLocaleString() : 'No data',
      reading?.activePower1?.toFixed(2) || '',
      reading?.activePower2?.toFixed(2) || '',
      reading?.activePower3?.toFixed(2) || '',
      reading?.activePower4?.toFixed(2) || '',
      reading?.activePower5?.toFixed(2) || '',
      reading?.activePower6?.toFixed(2) || '',
      totalActivePower?.toFixed(2) || '',
      reading?.muxPower1?.toFixed(2) || '',
      reading?.muxPower2?.toFixed(2) || '',
      reading?.muxPower3?.toFixed(2) || '',
      reading?.muxPower4?.toFixed(2) || '',
      reading?.muxPower5?.toFixed(2) || '',
      reading?.muxPower6?.toFixed(2) || '',
      totalMuxPower?.toFixed(2) || '',
      status
    ]
  })

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}