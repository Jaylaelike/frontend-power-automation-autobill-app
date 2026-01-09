# Environment Configuration

This document explains the environment variables used in the Power Monitoring Dashboard.

## 📋 Environment Variables

### **Database Configuration**
```env
DATABASE_URL="file:/path/to/database/power_monitoring.db"
```
- **Purpose**: SQLite database connection string
- **Format**: `file:/absolute/path/to/database.db`
- **Required**: Yes
- **Example**: `file:/Users/user/Desktop/ge-automate-meter-node/prisma/db/power_monitoring.db`

### **Next.js Configuration**
```env
NEXT_PUBLIC_APP_NAME="Power Monitoring Dashboard"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```
- **Purpose**: Application metadata displayed in UI
- **Required**: No (has defaults)

### **API Configuration**
```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
API_RATE_LIMIT=100
```
- **NEXT_PUBLIC_API_BASE_URL**: Base URL for API calls
- **API_RATE_LIMIT**: Maximum API requests per minute
- **Required**: No (defaults to current domain)

### **Dashboard Configuration**
```env
NEXT_PUBLIC_REFRESH_INTERVAL=30000
NEXT_PUBLIC_MAX_STATIONS_PER_PAGE=20
NEXT_PUBLIC_DEFAULT_TIMEZONE="Asia/Bangkok"
```
- **REFRESH_INTERVAL**: Auto-refresh interval in milliseconds (30 seconds)
- **MAX_STATIONS_PER_PAGE**: Pagination limit for station list
- **DEFAULT_TIMEZONE**: Timezone for timestamp display
- **Required**: No (has sensible defaults)

### **Development Configuration**
```env
NODE_ENV="development"
NEXT_PUBLIC_DEBUG_MODE="false"
```
- **NODE_ENV**: Environment mode (development/production)
- **DEBUG_MODE**: Enable debug logging and features
- **Required**: No (auto-detected)

### **Monitoring Configuration**
```env
NEXT_PUBLIC_ENABLE_REAL_TIME="true"
NEXT_PUBLIC_WEBSOCKET_URL="ws://localhost:3001"
```
- **ENABLE_REAL_TIME**: Enable real-time data updates
- **WEBSOCKET_URL**: WebSocket server for live data (if implemented)
- **Required**: No (defaults to polling)

### **Data Display Configuration**
```env
NEXT_PUBLIC_DECIMAL_PLACES=2
NEXT_PUBLIC_POWER_UNIT="W"
NEXT_PUBLIC_ENERGY_UNIT="kWh"
```
- **DECIMAL_PLACES**: Number of decimal places for numeric values
- **POWER_UNIT**: Unit symbol for power readings (Watts)
- **ENERGY_UNIT**: Unit symbol for energy readings (Kilowatt-hours)
- **Required**: No (has defaults)

### **Theme Configuration**
```env
NEXT_PUBLIC_DEFAULT_THEME="light"
NEXT_PUBLIC_ENABLE_DARK_MODE="true"
```
- **DEFAULT_THEME**: Default UI theme (light/dark)
- **ENABLE_DARK_MODE**: Allow users to toggle dark mode
- **Required**: No (defaults to light theme)

## 🔧 Setup Instructions

### 1. Copy Example File
```bash
cp .env.example .env
```

### 2. Update Database Path
Edit the `DATABASE_URL` to point to your actual database:
```env
DATABASE_URL="file:/Users/your-username/path/to/ge-automate-meter-node/prisma/db/power_monitoring.db"
```

### 3. Customize Settings (Optional)
Adjust other variables based on your preferences:
- Change refresh interval for faster/slower updates
- Modify timezone for your location
- Enable/disable features as needed

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. Start Development Server
```bash
npm run dev
# or
pnpm dev
```

## 🌍 Environment-Specific Configurations

### **Development**
```env
NODE_ENV="development"
NEXT_PUBLIC_DEBUG_MODE="true"
NEXT_PUBLIC_REFRESH_INTERVAL=10000  # Faster refresh for development
```

### **Production**
```env
NODE_ENV="production"
NEXT_PUBLIC_DEBUG_MODE="false"
NEXT_PUBLIC_REFRESH_INTERVAL=60000  # Slower refresh for production
API_RATE_LIMIT=1000  # Higher rate limit for production
```

## 🔒 Security Notes

- **Public Variables**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- **Private Variables**: Variables without the prefix are server-side only
- **Database URL**: Keep the database path secure and accessible only to the application
- **API Keys**: If added in the future, never prefix API keys with `NEXT_PUBLIC_`

## 🚀 Usage in Code

### **Client-Side (React Components)**
```typescript
const refreshInterval = parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '30000');
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Dashboard';
```

### **Server-Side (API Routes)**
```typescript
const rateLimit = parseInt(process.env.API_RATE_LIMIT || '100');
const databaseUrl = process.env.DATABASE_URL;
```

## 📝 Notes

- All `NEXT_PUBLIC_` variables are bundled into the client-side JavaScript
- Changes to environment variables require a server restart
- The database path should be absolute for reliability
- Timezone should be a valid IANA timezone identifier