const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Function to parse CSV data
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  const users = [];

  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    // Handle CSV parsing with proper quote handling
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Add the last value

    // Create user object
    const user = {};
    headers.forEach((header, index) => {
      const value = values[index] || null;
      
      // Clean up the header name
      const cleanHeader = header.trim();
      
      // Map CSV columns to database fields
      switch (cleanHeader) {
        case 'id':
          // Skip the CSV id, let database generate new ones
          break;
        case 'email':
          user.email = value;
          break;
        case 'username':
          user.username = value;
          break;
        case 'employeeId':
          user.employeeId = value;
          break;
        case 'Department':
          user.Department = value;
          break;
        case 'Division':
          user.Division = value === 'None' ? null : value;
          break;
        case 'EngName':
          user.EngName = value;
          break;
        case 'Mobile_Phone':
          user.Mobile_Phone = value === 'NULL' || value === '-' ? null : value;
          break;
        case 'Position':
          user.Position = value;
          break;
        case 'Section':
          user.Section = value === 'None' ? null : value;
          break;
        case 'ThaiName':
          user.ThaiName = value;
          break;
        case 'image_url':
          user.image_url = value;
          break;
      }
    });

    // Only add users with required fields
    if (user.email && user.username && user.employeeId) {
      users.push(user);
    }
  }

  return users;
}

async function importUsers() {
  try {
    console.log('🚀 Starting user import from CSV...');

    // Read the CSV file from the root directory
    const csvPath = path.join(__dirname, '../../../../users.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    console.log('📄 CSV file loaded successfully');

    // Parse CSV data
    const users = parseCSV(csvContent);
    console.log(`📊 Parsed ${users.length} users from CSV`);

    // Clear existing users (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing users...');
    await prisma.user.deleteMany({});

    // Import users in batches
    const batchSize = 50;
    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      console.log(`📥 Importing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}...`);

      for (const user of batch) {
        try {
          await prisma.user.create({
            data: user
          });
          importedCount++;
        } catch (error) {
          console.warn(`⚠️  Skipped user ${user.email}: ${error.message}`);
          skippedCount++;
        }
      }
    }

    console.log('\n✅ Import completed successfully!');
    console.log(`📊 Statistics:`);
    console.log(`   - Total users processed: ${users.length}`);
    console.log(`   - Successfully imported: ${importedCount}`);
    console.log(`   - Skipped (errors): ${skippedCount}`);

    // Verify import
    const totalUsers = await prisma.user.count();
    console.log(`   - Total users in database: ${totalUsers}`);

    // Show sample of imported users
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        username: true,
        employeeId: true,
        EngName: true,
        ThaiName: true,
        Department: true,
        Position: true
      }
    });

    console.log('\n📋 Sample imported users:');
    sampleUsers.forEach(user => {
      console.log(`   - ${user.EngName} (${user.email}) - ${user.Position}`);
    });

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (require.main === module) {
  importUsers();
}

module.exports = { importUsers, parseCSV };