import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const emailData = await request.json();
    
    // Simulate email sending for testing
    console.log('📧 TEST MODE: Email would be sent with the following data:');
    console.log('To:', emailData.userTo);
    console.log('CC:', emailData.cc);
    console.log('Subject: รายงานค่า Power Meter -', emailData.stationName);
    console.log('Station:', emailData.stationName);
    console.log('MUX Power Data:', {
      muxPower1: emailData.muxPower1,
      muxPower2: emailData.muxPower2,
      muxPower3: emailData.muxPower3,
      muxPower4: emailData.muxPower4,
      muxPower5: emailData.muxPower5,
      muxPower6: emailData.muxPower6,
      total: emailData.totalMuxPower
    });
    console.log('PDF Attachment:', emailData.pdfAttachment ? 'Yes' : 'No');
    
    // Simulate successful response
    return NextResponse.json(
      { 
        message: "Email sent successfully (TEST MODE)", 
        messageId: `test-${Date.now()}`,
        testMode: true,
        recipients: emailData.userTo.length,
        ccRecipients: emailData.cc?.length || 0
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Test mode error:', error);
    return NextResponse.json(
      { message: error.message || "Test mode failed" },
      { status: 500 }
    );
  }
}