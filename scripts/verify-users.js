const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyUsers() {
  try {
    console.log('🔍 Verifying user import...');
    
    // Get total count
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total users in database: ${totalUsers}`);
    
    // Get users by department
    const departments = await prisma.user.groupBy({
      by: ['Department'],
      _count: {
        Department: true
      },
      orderBy: {
        _count: {
          Department: 'desc'
        }
      }
    });
    
    console.log('\n🏢 Users by Department:');
    departments.forEach(dept => {
      console.log(`   - ${dept.Department}: ${dept._count.Department} users`);
    });
    
    // Get users by section
    const sections = await prisma.user.groupBy({
      by: ['Section'],
      _count: {
        Section: true
      },
      orderBy: {
        _count: {
          Section: 'desc'
        }
      },
      take: 10
    });
    
    console.log('\n📋 Top 10 Sections:');
    sections.forEach(section => {
      console.log(`   - ${section.Section}: ${section._count.Section} users`);
    });
    
    // Show some sample users with all fields
    const sampleUsers = await prisma.user.findMany({
      take: 3,
      orderBy: { ThaiName: 'asc' }
    });
    
    console.log('\n👥 Sample user records:');
    sampleUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.ThaiName} (${user.EngName})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Employee ID: ${user.employeeId}`);
      console.log(`   Department: ${user.Department}`);
      console.log(`   Division: ${user.Division}`);
      console.log(`   Position: ${user.Position}`);
      console.log(`   Section: ${user.Section}`);
      console.log(`   Mobile: ${user.Mobile_Phone || 'N/A'}`);
    });
    
    // Check for any potential issues
    const usersWithoutEmail = await prisma.user.count({
      where: {
        email: ''
      }
    });
    
    const usersWithoutThaiName = await prisma.user.count({
      where: {
        ThaiName: ''
      }
    });
    
    console.log('\n🔍 Data Quality Check:');
    console.log(`   - Users without email: ${usersWithoutEmail}`);
    console.log(`   - Users without Thai name: ${usersWithoutThaiName}`);
    
    console.log('\n✅ User verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUsers();