# Email System for Power Meter Reports

This document describes the email system implementation for sending power meter reports with PDF attachments.

## Features

### 1. User Management
- Import users from CSV file (`users.csv` in project root)
- Store user information in database including:
  - Email addresses
  - Thai and English names
  - Department and section information
  - Employee IDs and positions

### 2. Email Functionality
- Send power meter reports via email
- Station selector for choosing which station's data to send
- Multiple recipient selection (To and CC)
- Professional HTML email template based on receipt style
- PDF report attachment generation

### 3. PDF Report Generation
- Automatic PDF generation using jsPDF
- Professional table layout with station data
- Includes all MUX Power readings (1-6) and total
- Station name, last update time, and generation timestamp

## Technical Implementation

### Backend APIs

#### `/api/users`
- **GET**: Fetch all users from database
- **POST**: Import users from CSV file

#### `/api/sendmails`
- **POST**: Send email with PDF attachment
- Uses nodemailer with Thai PBS SMTP configuration
- Generates PDF on-the-fly and attaches to email

#### `/api/power-readings-for-email`
- **GET**: Fetch current power readings for email system

### Frontend Components

#### `SendEmailForm`
- Main component for email composition
- Station selection dropdown
- User selection with checkboxes for To/CC recipients
- PDF preview and download functionality
- Email sending with loading states

#### `PDF Generator`
- Utility functions for generating PDF reports
- Station-specific and multi-station report options
- Professional styling with tables and headers

### Database Schema

```sql
-- Users table for email recipients
model User {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  username    String
  employeeId  String   @unique
  Department  String
  Division    String
  EngName     String
  Mobile_Phone String?
  Position    String
  Section     String
  ThaiName    String
  image_url   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Email Template

The email template follows a professional receipt-style design with:
- Header with Thai PBS branding
- Station information section
- Power readings table
- Total power consumption summary
- Professional footer with contact information

## Configuration

### SMTP Settings
```javascript
const transporter = nodemailer.createTransporter({
  host: "webmail.thaipbs.or.th",
  port: 587,
  secure: false,
  auth: {
    user: "nocadmin@thaipbs.or.th",
    pass: "noctpbs",
  },
  tls: {
    rejectUnauthorized: false,
  },
});
```

### Required Environment Variables
- `DATABASE_URL`: Database connection string
- SMTP credentials are currently hardcoded but should be moved to environment variables

## Usage Instructions

### 1. Import Users
1. Navigate to the "Send Email Reports" page
2. Click "Import Users from CSV" button
3. Users will be imported from the `users.csv` file in the project root

### 2. Send Email Reports
1. Select a station from the dropdown
2. Choose recipients by checking boxes in the "To" section
3. Optionally select CC recipients
4. Click "Download PDF Report" to preview the report
5. Click "Send Email" to send the report with PDF attachment

### 3. Email Content
The email includes:
- Station name and last update time
- All MUX Power readings (1-6)
- Total MUX Power consumption
- Professional HTML formatting
- PDF attachment with detailed report

## File Structure

```
frontend/meter-reading-dashboard/
├── app/
│   ├── api/
│   │   ├── sendmails/route.ts          # Email sending API
│   │   ├── users/route.ts              # User management API
│   │   └── power-readings-for-email/route.ts
│   └── send-emails/
│       └── page.tsx                    # Email sending page
├── components/
│   ├── send-email-form.tsx             # Main email form component
│   └── ui/                             # UI components
├── lib/
│   ├── pdf-generator.ts                # PDF generation utilities
│   └── users-import.ts                 # User import functionality
└── prisma/
    └── schema.prisma                   # Database schema
```

## Dependencies

### Production Dependencies
- `jspdf`: PDF generation
- `jspdf-autotable`: Table formatting for PDFs
- `nodemailer`: Email sending
- `@prisma/client`: Database ORM

### Development Dependencies
- `@types/nodemailer`: TypeScript types for nodemailer

## Future Enhancements

1. **Email Templates**: Create multiple email templates for different report types
2. **Scheduling**: Add ability to schedule recurring email reports
3. **Email History**: Track sent emails and delivery status
4. **Bulk Operations**: Send reports to multiple stations at once
5. **Email Preferences**: Allow users to set email preferences and subscriptions
6. **Attachment Options**: Support for different report formats (Excel, CSV)
7. **Email Validation**: Validate email addresses before sending
8. **Retry Logic**: Implement retry mechanism for failed email deliveries

## Troubleshooting

### Common Issues

1. **SMTP Connection Failed**
   - Check SMTP server settings
   - Verify network connectivity
   - Ensure firewall allows SMTP traffic

2. **PDF Generation Errors**
   - Check if jsPDF dependencies are properly installed
   - Verify data format matches expected structure

3. **User Import Fails**
   - Ensure `users.csv` file exists in project root
   - Check CSV format matches expected structure
   - Verify database connection

4. **Email Not Received**
   - Check spam/junk folders
   - Verify recipient email addresses
   - Check SMTP server logs