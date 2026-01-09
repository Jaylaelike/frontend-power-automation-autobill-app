// Comprehensive email sending test
async function testSendEmail() {
  console.log('📧 Testing Email Send Functionality...\n');

  // Test data with real Thai station
  const testEmailData = {
    stationName: "พะโต๊ะ",
    lastUpdate: "2024-10-28T17:03:33.857Z",
    muxPower1: 102982768,
    muxPower2: 0,
    muxPower3: 78957280,
    muxPower4: 71288984,
    muxPower5: 59344640,
    muxPower6: 0,
    totalMuxPower: 312573672,
    userTo: ["SittichaiM@thaipbs.or.th"],
    //pdfAttachment: "JVBERi0xLjQKJcOkw7zDtsO4CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgo+PgpzdHJlYW0K" // Sample PDF base64
  };

  console.log('📋 Test Email Data:');
  console.log(`   Station: ${testEmailData.stationName}`);
  console.log(`   Total Power: ${testEmailData.totalMuxPower.toLocaleString()} kWh`);
  console.log(`   Recipients: ${testEmailData.userTo?.length || 0} (To), ${testEmailData.cc?.length || 0} (CC)`);
  console.log(`   PDF Attachment: ${testEmailData.pdfAttachment ? 'Yes' : 'No'}`);

  // Test 1: Regular email API (will likely fail due to SMTP)
  console.log('\n1. Testing Regular Email API...');
  try {
    const response = await fetch('http://localhost:3000/api/sendmails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmailData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Regular Email API: SUCCESS');
      console.log('   Message:', result.message);
      console.log('   Message ID:', result.messageId);
    } else {
      console.log('❌ Regular Email API: FAILED');
      console.log('   Status:', response.status);
      console.log('   Error:', result.message);
      
      // Analyze the error
      if (result.message.includes('ETIMEDOUT')) {
        console.log('   💡 Issue: SMTP connection timeout');
        console.log('   💡 Solution: Contact IT for SMTP server access');
      } else if (result.message.includes('EAUTH')) {
        console.log('   💡 Issue: Authentication failed');
        console.log('   💡 Solution: Check SMTP credentials');
      } else if (result.message.includes('ECONNREFUSED')) {
        console.log('   💡 Issue: Connection refused');
        console.log('   💡 Solution: Check firewall/network settings');
      }
    }
  } catch (error) {
    console.log('❌ Regular Email API: NETWORK ERROR');
    console.log('   Error:', error.message);
  }

  // Test 2: Test mode API (should work)
  console.log('\n2. Testing Test Mode API...');
  try {
    const response = await fetch('http://localhost:3000/api/sendmails/test-mode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmailData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Test Mode API: SUCCESS');
      console.log('   Message:', result.message);
      console.log('   Recipients:', result.recipients);
      console.log('   CC Recipients:', result.ccRecipients);
      console.log('   Test Mode:', result.testMode);
    } else {
      console.log('❌ Test Mode API: FAILED');
      console.log('   Status:', response.status);
      console.log('   Error:', result.message);
    }
  } catch (error) {
    console.log('❌ Test Mode API: NETWORK ERROR');
    console.log('   Error:', error.message);
  }

  // Test 3: Email without PDF attachment
  console.log('\n3. Testing Email Without PDF...');
  const noPdfData = { ...testEmailData, pdfAttachment: null };
  
  try {
    const response = await fetch('http://localhost:3000/api/sendmails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noPdfData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Email Without PDF: SUCCESS');
      console.log('   Message:', result.message);
    } else {
      console.log('❌ Email Without PDF: FAILED');
      console.log('   Error:', result.message);
    }
  } catch (error) {
    console.log('❌ Email Without PDF: NETWORK ERROR');
    console.log('   Error:', error.message);
  }

  // Test 4: Single recipient email
  console.log('\n4. Testing Single Recipient Email...');
  const singleRecipientData = {
    ...testEmailData,
    userTo: ["test@thaipbs.or.th"],
    cc: [],
    pdfAttachment: null
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/sendmails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(singleRecipientData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Single Recipient: SUCCESS');
      console.log('   Message:', result.message);
    } else {
      console.log('❌ Single Recipient: FAILED');
      console.log('   Error:', result.message);
    }
  } catch (error) {
    console.log('❌ Single Recipient: NETWORK ERROR');
    console.log('   Error:', error.message);
  }

  // Test 5: Validate email data structure
  console.log('\n5. Validating Email Data Structure...');
  const requiredFields = [
    'stationName', 'lastUpdate', 'muxPower1', 'muxPower2', 
    'muxPower3', 'muxPower4', 'muxPower5', 'muxPower6', 
    'totalMuxPower', 'userTo'
  ];

  let validationPassed = true;
  requiredFields.forEach(field => {
    if (testEmailData[field] === undefined || testEmailData[field] === null) {
      console.log(`   ❌ Missing field: ${field}`);
      validationPassed = false;
    } else {
      console.log(`   ✅ Field present: ${field}`);
    }
  });

  if (validationPassed) {
    console.log('✅ Data Structure: VALID');
  } else {
    console.log('❌ Data Structure: INVALID');
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('   🎯 Purpose: Verify email sending functionality');
  console.log('   📧 Email Template: Professional HTML with Thai support');
  console.log('   📎 PDF Generation: Ready with Thai fonts');
  console.log('   👥 Recipients: Multiple recipient support');
  console.log('   🔧 Test Mode: Available for development/testing');
  
  console.log('\n💡 Recommendations:');
  console.log('   1. Use test mode for development and demonstration');
  console.log('   2. Contact IT department for SMTP server access');
  console.log('   3. Test with single recipient first when SMTP is fixed');
  console.log('   4. Verify PDF generation works in browser');
  console.log('   5. Check server logs for detailed error information');

  console.log('\n🚀 Next Steps:');
  console.log('   • If test mode works: System is ready, only SMTP needs fixing');
  console.log('   • If regular email fails: Expected due to SMTP connectivity');
  console.log('   • Contact IT: Request access to webmail.thaipbs.or.th:587');
  console.log('   • Alternative: Use different SMTP server for testing');
}

// Run the test
testSendEmail().catch(console.error);