const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

async function importUsers() {
  try {
    console.log('🔍 Looking for users.csv file...');
    
    // Try multiple possible paths for the CSV file
    const possiblePaths = [
      path.join(__dirname, '../../../../users.csv'),
      path.join(__dirname, '../../../users.csv'),
      path.join(__dirname, '../../users.csv'),
      path.join(__dirname, '../users.csv'),
      path.join(__dirname, 'users.csv'),
      path.join(process.cwd(), '../../../users.csv'),
      path.join(process.cwd(), '../../users.csv'),
      path.join(process.cwd(), '../users.csv'),
      path.join(process.cwd(), 'users.csv'),
    ];
    
    let csvPath = '';
    let csvContent = '';
    
    for (const testPath of possiblePaths) {
      try {
        if (fs.existsSync(testPath)) {
          csvPath = testPath;
          csvContent = fs.readFileSync(testPath, 'utf-8');
          console.log(`✅ Found CSV file at: ${testPath}`);
          break;
        }
      } catch (err) {
        continue;
      }
    }
    
    if (!csvContent) {
      console.error('❌ users.csv file not found in any of the expected locations:');
      possiblePaths.forEach(p => console.log(`   - ${p}`));
      process.exit(1);
    }
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]);
    
    console.log('📋 CSV Headers:', headers);
    console.log(`📊 Total lines in CSV: ${lines.length}`);
    
    const users = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      
      if (values.length >= 14) {
        const user = {
          email: values[1] || '',
          username: values[2] || '',
          employeeId: values[6] || '',
          Department: values[7] || '',
          Division: values[8] || '',
          EngName: values[9] || '',
          Mobile_Phone: values[10] === 'NULL' || !values[10] ? null : values[10],
          Position: values[11] || '',
          Section: values[12] || '',
          ThaiName: values[13] || '',
          image_url: values[14] === 'NULL' || !values[14] ? null : values[14]
        };
        
        // Only add users with valid email addresses
        if (user.email && user.email.includes('@')) {
          users.push(user);
        }
      }
    }
    
    console.log(`✅ Parsed ${users.length} valid users from CSV`);
    
    // Import users to database
    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    console.log('💾 Starting database import...');
    
    for (const user of users) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });
        
        if (existingUser) {
          await prisma.user.update({
            where: { email: user.email },
            data: {
              username: user.username,
              Department: user.Department,
              Division: user.Division,
              EngName: user.EngName,
              Mobile_Phone: user.Mobile_Phone,
              Position: user.Position,
              Section: user.Section,
              ThaiName: user.ThaiName,
              image_url: user.image_url,
            }
          });
          updatedCount++;
        } else {
          await prisma.user.create({
            data: user
          });
          importedCount++;
        }
        
        if ((importedCount + updatedCount) % 10 === 0) {
          console.log(`   Processed ${importedCount + updatedCount} users...`);
        }
      } catch (err) {
        console.error(`❌ Error processing user ${user.email}:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Import completed!');
    console.log(`📈 Results:`);
    console.log(`   - New users imported: ${importedCount}`);
    console.log(`   - Existing users updated: ${updatedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Total processed: ${importedCount + updatedCount}`);
    
    // Verify the import
    const totalUsers = await prisma.user.count();
    console.log(`\n✅ Total users in database: ${totalUsers}`);
    
    // Show some sample users
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      select: {
        email: true,
        ThaiName: true,
        EngName: true,
        Department: true,
        Section: true
      }
    });
    
    console.log('\n👥 Sample users:');
    sampleUsers.forEach(user => {
      console.log(`   - ${user.ThaiName} (${user.EngName}) - ${user.email}`);
    });
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importUsers();