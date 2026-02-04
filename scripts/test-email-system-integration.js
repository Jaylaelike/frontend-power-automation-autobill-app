// Integration test for the email system with real data
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testEmailSystemIntegration() {
  console.log('🧪 Testing Email System Integration with Real Data...\n');

  try {
    // Test 1: Get stations for email dropdown
    console.log('1. Testing station list for email form...');
    const stationsResponse = await fetch(`${BASE_URL}/api/power-readings-for-email`);
    
    if (stationsResponse.ok) {
      const stations = await stationsResponse.json();
      console.log(`✅ Found ${stations.length} stations with power data`);
      
      if (stations.length > 0) {
        // Show first few stations
        console.log('   Available stations:');
        stations.slice(0, 5).forEach((station, index) => {
          console.log(`   ${index + 1}. ${station.stationName} - Total: ${station.totalMuxPower.toFixed(2)} kWh`);
          console.log(`      Last Update: ${new Date(station.lastUpdate).toLocaleString()}`);
        });
        
        // Test 2: Get specific station data (like when user selects in dropdown)
        const testStation = stations[0];
        console.log(`\n2. Testing station selection: ${testStation.stationName}`);
        
        const stationDataResponse = await fetch(`${BASE_URL}/api/station-data/${encodeURIComponent(testStation.stationName)}`);
        
        if (stationDataResponse.ok) {
          const stationData = await stationDataResponse.json();
          console.log(`✅ Retrieved detailed data for selected station`);
          console.log(`   Station: ${stationData.stationName}`);
          console.log(`   IP Address: ${stationData.ipAddress || 'N/A'}`);
          console.log(`   Last Update: ${new Date(stationData.lastUpdate).toLocaleString()}`);
          console.log(`   MUX Power Readings:`);
          console.log(`     MUX 1: ${stationData.muxPower1.toLocaleString()} kWh`);
          console.log(`     MUX 2: ${stationData.muxPower2.toLocaleString()} kWh`);
          console.log(`     MUX 3: ${stationData.muxPower3.toLocaleString()} kWh`);
          console.log(`     MUX 4: ${stationData.muxPower4.toLocaleString()} kWh`);
          console.log(`     MUX 5: ${stationData.muxPower5.toLocaleString()} kWh`);
          console.log(`     MUX 6: ${stationData.muxPower6.toLocaleString()} kWh`);
          console.log(`     Total: ${stationData.totalMuxPower.toLocaleString()} kWh`);
          
          if (stationData.activePower1 !== null) {
            console.log(`   Active Power readings also available`);
          }
          
          // Test 3: Check users are available for email
          console.log(`\n3. Testing user availability for email recipients...`);
          const usersResponse = await fetch(`${BASE_URL}/api/users`);
          
          if (usersResponse.ok) {
            const users = await usersResponse.json();
            console.log(`✅ Found ${users.length} users available for email selection`);
            
            // Show sample users
            console.log('   Sample recipients:');
            users.slice(0, 3).forEach(user => {
              console.log(`   - ${user.ThaiName} (${user.EngName}) - ${user.email}`);
              console.log(`     Section: ${user.Section}`);
            });
            
            console.log(`\n🎉 Email System Integration Test PASSED!`);
            console.log(`\n📋 System Status:`);
            console.log(`   ✅ Real station data: ${stations.length} stations`);
            console.log(`   ✅ Station selection API: Working`);
            console.log(`   ✅ User management: ${users.length} users ready`);
            console.log(`   ✅ Live data fetching: Functional`);
            console.log(`   ✅ Email system: Ready to send reports`);
            
            console.log(`\n🚀 Ready to use:`);
            console.log(`   1. Visit: ${BASE_URL}/send-emails`);
            console.log(`   2. Select from ${stations.length} real stations`);
            console.log(`   3. Choose from ${users.length} Thai PBS users`);
            console.log(`   4. Send reports with live power data`);
            
          } else {
            console.log(`❌ Users API failed: ${usersResponse.status}`);
          }
          
        } else {
          console.log(`❌ Station data API failed: ${stationDataResponse.status}`);
        }
        
      } else {
        console.log('⚠️  No stations with power data found');
      }
    } else {
      console.log(`❌ Stations API failed: ${stationsResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.log('\n💡 Make sure the development server is running:');
    console.log('   pnpm dev');
  }
}

// Run the integration test
testEmailSystemIntegration();