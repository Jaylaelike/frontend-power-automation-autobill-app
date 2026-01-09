// Test email sending with PDF attachment
async function testEmailWithPDF() {
  console.log("🧪 Testing Email with PDF Attachment...\n");

  // Simulate the frontend PDF generation process
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
    pdfAttachment:
      "JVBERi0xLjQKJcOkw7zDtsO4DQoxIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KPj4KZW5kb2JqCgozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNCAwIFIKPj4KPj4KL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCgo1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihUZXN0IFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjA0IDAwMDAwIG4gCjAwMDAwMDAyNzEgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgozNjUKJSVFT0Y=", // Simple test PDF in base64
  };

  try {
    console.log("1. Testing API endpoint with PDF attachment...");
    const response = await fetch("http://localhost:3000/api/sendmails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    console.log("Response Status:", response.status);
    console.log("Response Body:", result);

    if (response.ok) {
      console.log("✅ Email with PDF: SUCCESS");
      console.log("📧 Check the recipient email for the PDF attachment");
    } else {
      console.log("❌ Email with PDF: FAILED");
      console.log("Error Message:", result.message);

      if (result.message.includes("PDF")) {
        console.log("💡 PDF-specific error detected");
      }
    }
  } catch (error) {
    console.log("❌ Test Failed:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("💡 Server not running. Start with: pnpm dev");
    }
  }
}

// Run test
testEmailWithPDF().catch(console.error);
