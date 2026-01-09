import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export interface User {
  id: number;
  email: string;
  username: string;
  employeeId: string;
  Department: string;
  Division: string;
  EngName: string;
  Mobile_Phone: string | null;
  Position: string;
  Section: string;
  ThaiName: string;
  image_url: string | null;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
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

export async function importUsersFromCSV() {
  try {
    // Try multiple possible paths for the CSV file
    const possiblePaths = [
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
          break;
        }
      } catch (err) {
        continue;
      }
    }
    
    if (!csvContent) {
      throw new Error('users.csv file not found in any of the expected locations');
    }
    
    console.log(`Found CSV file at: ${csvPath}`);
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]);
    
    console.log('CSV Headers:', headers);
    
    const users: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
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
    
    console.log(`Parsed ${users.length} valid users from CSV`);
    
    // Import users to database
    let importedCount = 0;
    let updatedCount = 0;
    
    for (const user of users) {
      try {
        const result = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            username: user.username,
            Department: user.Department,
            Division: user.Division,
            EngName: user.EngName,
            Mobile_Phone: user.Mobile_Phone,
            Position: user.Position,
            Section: user.Section,
            ThaiName: user.ThaiName,
            image_url: user.image_url,
          },
          create: user
        });
        
        if (result.createdAt === result.updatedAt) {
          importedCount++;
        } else {
          updatedCount++;
        }
      } catch (err) {
        console.error(`Error importing user ${user.email}:`, err);
      }
    }
    
    return { 
      success: true, 
      count: users.length,
      imported: importedCount,
      updated: updatedCount
    };
  } catch (error) {
    console.error('Error importing users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { ThaiName: 'asc' }
    });
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}