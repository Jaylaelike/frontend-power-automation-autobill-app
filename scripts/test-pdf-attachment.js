// Test PDF generation and attachment
const { generateStationPDF } = require('../lib/pdf-generator');

async function testPDFAttachment() {
  console.log('🧪 Testing PDF Attachment Process...\n');

  const testStationData = {
    stationName: "Test Station",
    lastUpdate: new Date().toISOString(),
    muxPower1: 100.5,
    muxPower2: 200.3,
    muxPower3: 150.7,
    muxPower4: 175.2,
    muxPower5: 125.8,
    muxPower6: 190.1,
    totalMuxPower: 942.6
  };

  try {
    console.log('1. Generating PDF...');
    const pdfBytes = await generateStationPDF(testStationData);
    console.log(`✅ PDF generated: ${pdfBytes.length} bytes`);

    console.log('2. Converting to base64...');
    
    // Test the improved conversion method
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const pdfBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    console.log(`✅ Base64 conversion: ${pdfBase64.length} characters`);

    console.log('3. Validating base64...');
    // Test base64 validation
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(pdfBase64)) {
      throw new Error('Invalid base64 format');
    }
    console.log('✅ Base64 format valid');

    console.log('4. Testing buffer conversion...');
    const testBuffer = Buffer.from(pdfBase64, 'base64');
    console.log(`✅ Buffer created: ${testBuffer.length} bytes`);

    console.log('5. Validating PDF header...');
    if (testBuffer.length < 4 || testBuffer.toString('ascii', 0, 4) !== '%PDF') {
      throw new Error('Invalid PDF file format');
    }
    console.log('✅ PDF header valid');

    console.log('6. Testing email payload size...');
    const emailPayload = {
      stationName: testStationData.stationName,
      lastUpdate: testStationData.lastUpdate,
      muxPower1: testStationData.muxPower1,
      muxPower2: testStationData.muxPower2,
      muxPower3: testStationData.muxPower3,
      muxPower4: testStationData.muxPower4,
      muxPower5: testStationData.muxPower5,
      muxPower6: testStationData.muxPower6,
      totalMuxPower: testStationData.totalMuxPower,
      userTo: ["sittichaim@thaipbs.or.th"],
      cc: [],
      pdfAttachment: pdfBase64
    };

    const payloadSize = JSON.stringify(emailPayload).length;
    console.log(`✅ Email payload size: ${(payloadSize / 1024).toFixed(2)} KB`);

    if (payloadSize > 50 * 1024 * 1024) { // 50MB limit for most servers
      console.log('⚠️  Warning: Payload might be too large for some servers');
    }

    console.log('\n🎉 All PDF attachment tests passed!');
    console.log('The PDF attachment should work correctly now.');

  } catch (error) {
    console.log('❌ PDF attachment test failed:', error.message);
    
    if (error.message.includes('jsPDF')) {
      console.log('💡 Make sure jsPDF dependencies are installed');
    } else if (error.message.includes('base64')) {
      console.log('💡 Base64 conversion issue - check the conversion method');
    } else if (error.message.includes('Buffer')) {
      console.log('💡 Buffer creation issue - check Node.js version');
    }
  }
}

testPDFAttachment().catch(console.error);