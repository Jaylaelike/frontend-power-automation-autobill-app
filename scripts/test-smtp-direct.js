// Direct SMTP test without Next.js server
const nodemailer = require('nodemailer');

async function testSMTPDirect() {
  console.log('🧪 Testing SMTP Configuration Directly...\n');

  const smtpConfig = {
    host: "webmail.thaipbs.or.th",
    port: 587,
    secure: false,
    name: "thaipbs.or.th", // Specify hostname for HELO command
    auth: {
      user: "RRS@thaipbs.or.th",
      pass: "rR$%^&2025",
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  };

  try {
    console.log('1. Creating transporter...');
    const transporter = nodemailer.createTransporter(smtpConfig);

    console.log('2. Testing connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection: SUCCESS');

    console.log('3. Sending test email...');
    const testEmail = {
      from: "RRS@thaipbs.or.th",
      to: "SittichaiM@thaipbs.or.th",
      subject: "Test Email - HELO Fix",
      html: `
        <h2>SMTP Test Email</h2>
        <p>This is a test email to verify the HELO fix.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <p>HELO hostname: thaipbs.or.th</p>
      `,
    };

    const info = await transporter.sendMail(testEmail);
    console.log('✅ Email Sent Successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);

  } catch (error) {
    console.log('❌ SMTP Test Failed:', error.message);
    
    if (error.message.includes('Invalid domain name')) {
      console.log('💡 Still getting HELO error. The server may not accept "thaipbs.or.th" as hostname.');
      console.log('💡 Try using a different hostname or contact IT support.');
    }
    
    if (error.code) {
      console.log('Error Code:', error.code);
    }
  }
}

// Run test
testSMTPDirect().catch(console.error);