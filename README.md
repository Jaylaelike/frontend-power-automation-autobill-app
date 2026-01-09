# Meter Reading Dashboard

A modern, real-time power monitoring dashboard built with Next.js, featuring comprehensive analytics for Active Power and MUX Power channels across multiple stations.

## Screenshots

### Dashboard Overview
![Dashboard Overview](https://56fwnhyzti.ufs.sh/f/aK4w8mNL3AiP2YMwGIsEL4ocBZQyGd7xSpqsOt8wHiMNljnz)

### Station Detail Page
![Station Detail](https://56fwnhyzti.ufs.sh/f/aK4w8mNL3AiP2YdPQmfEL4ocBZQyGd7xSpqsOt8wHiMNljnz)

### Power Analytics
![Power Analytics](https://56fwnhyzti.ufs.sh/f/aK4w8mNL3AiPQ8G1bMiIqWN4GPlHEcD7kVZyXApfCLtROe0n)

## Features

### Station Overview
- Real-time station status monitoring (Active, Stale, Offline)
- Station list with search and filtering capabilities
- Quick navigation to station details

### Station Detail Page
- **Station Header**: Display station name, IP address, scene, and status
- **Data Controls**: Date range picker and time period selector for historical analysis
- **Power Summary Cards**:
  - Total Active Power (W and kW)
  - Total MUX Power (W and kW)
  - Active Sensors count

### Historical Data Analysis
- **Historical Bar Chart**: Aggregated power data visualization
- Configurable time periods: Day, Week, Month, Year
- Date range selection for custom analysis

### Active Power Breakdown
- Individual charts for 6 Active Power channels
- Analytics per channel: MIN, MAX, AVG values
- Historical data visualization based on selected time period
- Color-coded cards for easy identification

### MUX Power Breakdown
- Individual charts for 6 MUX Power channels
- Real-time power readings display
- Values shown in both W and kW units

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui with Radix UI primitives
- **Charts**: ApexCharts (react-apexcharts)
- **Database**: SQLite with Prisma ORM
- **State Management**: TanStack Query (React Query)
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Docker (optional, for containerized deployment)

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd frontend/meter-reading-dashboard
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your database URL in `.env`:
```env
DATABASE_URL="file:./dev.db"
```

5. Run database migrations:
```bash
pnpm prisma migrate dev
```

6. Start the development server:
```bash
pnpm dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Development

#### Quick Start with Docker

1. **Development mode with hot reload:**
```bash
# Build and run development container
pnpm docker:build:dev
pnpm docker:run:dev
```

2. **Production mode:**
```bash
# Build and run production container
pnpm docker:build:prod
pnpm docker:run
```

3. **Using Docker Compose:**
```bash
# Development environment
pnpm docker:up:dev

# Production environment
pnpm docker:up

# View logs
pnpm docker:logs

# Stop containers
pnpm docker:down
```

#### Docker Build Targets

The Dockerfile includes multiple build targets:

| Target | Purpose | Usage |
|--------|---------|-------|
| `development` | Hot reload development | `docker build --target development` |
| `builder` | Build stage only | Internal use |
| `production` | Optimized production | `docker build --target production` |
| `standalone` | Full production build | `docker build --target standalone` |

#### Docker Environment Variables

Create a `.env` file for Docker deployment:
```env
NODE_ENV=production
DATABASE_URL="file:../../data/production.db"
PORT=3000
```

## Project Structure

```
frontend/meter-reading-dashboard/
├── app/
│   ├── api/
│   │   └── station/
│   │       └── [id]/
│   │           ├── route.ts              # Station detail API
│   │           ├── historical/route.ts   # Historical data API
│   │           ├── realtime/route.ts     # Realtime data API
│   │           ├── active-power-analytics/route.ts
│   │           └── mux-analytics/route.ts
│   ├── station/
│   │   └── [id]/
│   │       └── page.tsx                  # Station detail page
│   ├── layout.tsx
│   ├── page.tsx                          # Home page
│   └── globals.css
├── components/
│   ├── ui/                               # shadcn/ui components
│   ├── active-power-breakdown.tsx
│   ├── mux-power-breakdown.tsx
│   ├── power-summary-cards.tsx
│   ├── historical-bar-chart.tsx
│   ├── station-header.tsx
│   ├── date-range-picker.tsx
│   └── time-period-selector.tsx
├── lib/
│   ├── types/
│   │   └── station.ts                    # TypeScript types
│   └── utils.ts
├── prisma/
│   └── schema.prisma                     # Database schema
└── __tests__/                            # Test files
```

## API Endpoints

### Station APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/station/[id]` | GET | Get station details |
| `/api/station/[id]/historical` | GET | Get historical power data |
| `/api/station/[id]/realtime` | GET | Get realtime power readings |
| `/api/station/[id]/active-power-analytics` | GET | Get Active Power analytics |
| `/api/station/[id]/mux-analytics` | GET | Get MUX Power analytics |

### Query Parameters

**Historical Data API:**
- `from`: Start date (ISO string)
- `to`: End date (ISO string)
- `period`: Aggregation period (`day`, `week`, `month`, `year`)

**Realtime Data API:**
- `minutes`: Number of minutes of data to fetch (default: 30)

## Database Schema

### PowerReading Model
```prisma
model PowerReading {
  id          String   @id @default(cuid())
  stationId   String
  timestamp   DateTime
  
  // Active Power readings (Watts)
  activePower1  Float?
  activePower2  Float?
  activePower3  Float?
  activePower4  Float?
  activePower5  Float?
  activePower6  Float?
  
  // MUX Power Meter readings (kWh)
  muxPower1     Float?
  muxPower2     Float?
  muxPower3     Float?
  muxPower4     Float?
  muxPower5     Float?
  muxPower6     Float?
}
```

## Scripts

### Development Scripts
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Testing Scripts
```bash
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Run tests with coverage
```

### Docker Scripts
```bash
# Build Docker images
pnpm docker:build      # Build default image
pnpm docker:build:dev  # Build development image
pnpm docker:build:prod # Build production image

# Run Docker containers
pnpm docker:run        # Run production container
pnpm docker:run:dev    # Run development container with hot reload

# Docker Compose
pnpm docker:up         # Start production environment
pnpm docker:up:dev     # Start development environment
pnpm docker:down       # Stop all containers
pnpm docker:logs       # View container logs
```

### Database Scripts
```bash
pnpm prisma studio    # Open Prisma Studio
pnpm prisma migrate   # Run migrations
pnpm prisma generate  # Generate Prisma Client
```

## Deployment

### Docker Deployment (Recommended)

#### Production Deployment
```bash
# Build and start the dashboard
pnpm docker:up

# Or manually
pnpm docker:build:prod
pnpm docker:run
```

#### Development with Docker
```bash
# Start development environment with hot reload
pnpm docker:up:dev

# Or manually
pnpm docker:build:dev
pnpm docker:run:dev
```

### Traditional Deployment

#### Production Build
```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

#### Environment Configuration
```env
NODE_ENV=production
DATABASE_URL="file:./production.db"
PORT=3000
```

### Health Checks

The Docker container includes health checks:
- **Endpoint**: `http://localhost:3000`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3

## Configuration

### Time Period Definitions
- **Day**: Last 24 hours (hourly aggregation)
- **Week**: Last 7 days (daily aggregation)
- **Month**: Last 30 days (daily aggregation)
- **Year**: Last 365 days (monthly aggregation)

### Auto-refresh Intervals
- Station data: 30 seconds
- Realtime data: 5 seconds

### Docker Configuration

#### Multi-stage Build
The Dockerfile uses multi-stage builds for optimization:
- **Base**: Common dependencies and setup
- **Development**: Hot reload with volume mounts
- **Builder**: Build stage for production assets
- **Production**: Optimized runtime with non-root user
- **Standalone**: Complete production build

#### Volume Mounts
- `/app/data` - Database files
- `/app/prisma` - Prisma schema files
- `/app` - Source code (development only)

#### Security Features
- Runs as non-root user (`nextjs:nodejs`)
- Minimal production dependencies
- Health checks for monitoring
- Secure file permissions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
