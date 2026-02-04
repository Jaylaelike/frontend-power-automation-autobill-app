// Test the email API directly
async function testEmailAPI() {
  console.log('🧪 Testing Email API Endpoint...\n');

  const testData = {
    stationName: "Test Station",
    lastUpdate: new Date().toISOString(),
    muxPower1: 100.5,
    muxPower2: 200.3,
    muxPower3: 150.7,
    muxPower4: 175.2,
    muxPower5: 125.8,
    muxPower6: 190.1,
    totalMuxPower: 942.6,
    userTo: ["SittichaiM@thaipbs.or.th"],
    cc: [],
    pdfAttachment: null // Test without PDF first
  };

  try {
    console.log('1. Testing API endpoint without PDF...');
    const response = await fetch('http://localhost:3000/api/sendmails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Body:', result);

    if (response.ok) {
      console.log('✅ Email API: SUCCESS');
    } else {
      console.log('❌ Email API: FAILED');
      console.log('Error Message:', result.message);
    }

  } catch (error) {
    console.log('❌ API Test Failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Server not running. Start with: pnpm dev');
    }
  }

  // Test 2: Check if server is running
  console.log('\n2. Testing server health...');
  try {
    const healthResponse = await fetch('http://localhost:3000/api/power-readings-for-email');
    if (healthResponse.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server responding with errors');
    }
  } catch (error) {
    console.log('❌ Server not accessible:', error.message);
  }
}

// Run test
testEmailAPI().catch(console.error);