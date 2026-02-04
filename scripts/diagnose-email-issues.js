// Email diagnostic script to identify common issues
const nodemailer = require('nodemailer');

async function diagnoseEmailIssues() {
  console.log('🔍 Diagnosing Email System Issues...\n');

  // Test 1: SMTP Connection
  console.log('1. Testing SMTP Connection...');
  try {
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

    // Verify connection
    const verified = await transporter.verify();
    if (verified) {
      console.log('✅ SMTP Connection: SUCCESS');
    }
  } catch (error) {
    console.log('❌ SMTP Connection: FAILED');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);
    
    // Common SMTP issues
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Issue: Connection refused - check host/port');
    } else if (error.code === 'EAUTH') {
      console.log('   💡 Issue: Authentication failed - check credentials');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   💡 Issue: Connection timeout - check network/firewall');
    }
  }

  // Test 2: Email Format Validation
  console.log('\n2. Testing Email Format Validation...');
  const testEmails = [
    'valid@thaipbs.or.th',
    'invalid-email',
    '',
    null,
    undefined
  ];

  testEmails.forEach(email => {
    const isValid = validateEmail(email);
    console.log(`   ${email || 'null/undefined'}: ${isValid ? '✅' : '❌'}`);
  });

  // Test 3: PDF Attachment Size
  console.log('\n3. Testing PDF Attachment...');
  try {
    // Simulate a large base64 string (like PDF)
    const testPdfBase64 = 'JVBERi0xLjQKJcOkw7zDtsO4CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgo+PgpzdHJlYW0KQNP...'; // Sample PDF header
    const buffer = Buffer.from(testPdfBase64, 'base64');
    console.log(`   PDF Buffer Size: ${buffer.length} bytes`);
    
    if (buffer.length > 25 * 1024 * 1024) { // 25MB limit
      console.log('   ❌ PDF too large (>25MB)');
    } else {
      console.log('   ✅ PDF size acceptable');
    }
  } catch (error) {
    console.log('   ❌ PDF processing error:', error.message);
  }

  // Test 4: Network Connectivity
  console.log('\n4. Testing Network Connectivity...');
  try {
    const dns = require('dns').promises;
    const resolved = await dns.lookup('webmail.thaipbs.or.th');
    console.log('   ✅ DNS Resolution: SUCCESS');
    console.log('   IP Address:', resolved.address);
  } catch (error) {
    console.log('   ❌ DNS Resolution: FAILED');
    console.log('   Error:', error.message);
  }

  // Test 5: Common Email Issues
  console.log('\n5. Common Email Issues Checklist:');
  console.log('   📧 Email Recipients:');
  console.log('      - Check if recipient emails are valid');
  console.log('      - Ensure no empty or null recipients');
  console.log('      - Verify email addresses exist');
  
  console.log('   🔐 Authentication:');
  console.log('      - Verify SMTP credentials are correct');
  console.log('      - Check if account is not locked/suspended');
  console.log('      - Ensure 2FA is not blocking access');
  
  console.log('   🌐 Network:');
  console.log('      - Check firewall allows SMTP (port 587)');
  console.log('      - Verify VPN/proxy settings');
  console.log('      - Test from different network if possible');
  
  console.log('   📎 Attachments:');
  console.log('      - PDF generation might be failing');
  console.log('      - Base64 encoding issues');
  console.log('      - File size too large');
  
  console.log('   ⚙️ Server Configuration:');
  console.log('      - Check server timezone settings');
  console.log('      - Verify environment variables');
  console.log('      - Check server memory/resources');

  console.log('\n📋 Recommended Debugging Steps:');
  console.log('1. Test email without PDF attachment first');
  console.log('2. Try sending to a single recipient');
  console.log('3. Check server logs for detailed error messages');
  console.log('4. Test SMTP settings with external tool');
  console.log('5. Verify recipient email addresses are active');
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Run diagnostics
diagnoseEmailIssues().catch(console.error);