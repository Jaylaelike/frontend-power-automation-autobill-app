// Test the timeout fix with a simple email
const nodemailer = require('nodemailer');

async function testTimeoutFix() {
  console.log('🧪 Testing Timeout Fix...\n');

  const smtpConfig = {
    host: "webmail.thaipbs.or.th",
    port: 587,
    secure: false,
    name: "thaipbs.or.th",
    auth: {
      user: "RRS@thaipbs.or.th",
      pass: "rR$%^&2025",
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 120000, // 2 minutes
    greetingTimeout: 60000,    // 1 minute
    socketTimeout: 120000,     // 2 minutes
    pool: true,
    maxConnections: 1,
    maxMessages: 3,
  };

  try {
    console.log('1. Creating transporter with optimized timeouts...');
    const transporter = nodemailer.createTransporter(smtpConfig);

    console.log('2. Testing connection...');
    await transporter.verify();
    console.log('✅ Connection verified');

    console.log('3. Sending simple test email...');
    const startTime = Date.now();
    
    const testEmail = {
      from: "RRS@thaipbs.or.th",
      to: "SittichaiM@thaipbs.or.th",
      subject: "Timeout Fix Test",
      html: `
        <h2>Timeout Fix Test</h2>
        <p>This is a simple test to verify the timeout fix.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
    };

    const info = await transporter.sendMail(testEmail);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Email sent successfully in ${duration}ms`);
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
      console.log('💡 Still getting timeout. Possible solutions:');
      console.log('   - Check network connectivity');
      console.log('   - Try from a different network');
      console.log('   - Contact IT about firewall settings');
      console.log('   - Try port 25 or 465 instead of 587');
    }
  }
}

testTimeoutFix().catch(console.error);