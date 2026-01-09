import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const {
      stationName,
      lastUpdate,
      muxPower1,
      muxPower2,
      muxPower3,
      muxPower4,
      muxPower5,
      muxPower6,
      totalMuxPower,
      userTo,
      cc,
      pdfAttachment,
    } = await request.json();

    const emailHtml = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
<head>
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  <meta name="x-apple-disable-message-reformatting" />
</head>
<body style="background-color:#ffffff">
  <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
    <tbody>
      <tr>
        <td style='font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;background-color:#ffffff'>
          <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
            Power Meter Report - ${stationName}
          </div>
          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:100%;margin:0 auto;padding:20px 0 48px;width:660px">
            <tbody>
              <tr style="width:100%">
                <td>
                  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tbody>
                      <tr>
                        <td>
                          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                            <tbody style="width:100%">
                              <tr style="width:100%">
                                <td>
                                  <h1 style="font-size:32px;line-height:24px;font-weight:300;color:#333333;margin-top:16px;margin-bottom:16px">Power Meter Report</h1>
                                </td>
                                <td align="right" style="display:table-cell">
                                  <p style="font-size:32px;line-height:24px;font-weight:300;color:#888888;margin-top:16px;margin-bottom:16px">Report</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;color:rgb(51,51,51);background-color:rgb(250,250,250);border-radius:3px;font-size:12px">
                    <tbody>
                      <tr>
                        <td>
                          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="min-height:46px">
                            <tbody style="width:100%">
                              <tr style="width:100%">
                                <td colspan="2">
                                  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr>
                                        <td>
                                          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                            <tbody style="width:100%">
                                              <tr style="width:100%">
                                                <td style="padding-left:20px;border-style:solid;border-color:white;border-width:0px 1px 1px 0px;min-height:44px">
                                                  <p style="font-size:10px;line-height:1.4;margin:0;padding:0;color:rgb(102,102,102)">STATION NAME</p>
                                                  <p style="font-size:12px;line-height:1.4;margin:0;padding:0">${stationName}</p>
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                            <tbody style="width:100%">
                                              <tr style="width:100%">
                                                <td style="padding-left:20px;border-style:solid;border-color:white;border-width:0px 1px 1px 0px;min-height:44px">
                                                  <p style="font-size:10px;line-height:1.4;margin:0;padding:0;color:rgb(102,102,102)">LAST UPDATE</p>
                                                  <p style="font-size:12px;line-height:1.4;margin:0;padding:0">${lastUpdate}</p>
                                                </td>
                                                <td style="padding-left:20px;border-style:solid;border-color:white;border-width:0px 1px 1px 0px;min-height:44px">
                                                  <p style="font-size:10px;line-height:1.4;margin:0;padding:0;color:rgb(102,102,102)">REPORT DATE</p>
                                                  <p style="font-size:12px;line-height:1.4;margin:0;padding:0">${new Date().toLocaleDateString()}</p>
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;color:rgb(51,51,51);background-color:rgb(250,250,250);border-radius:3px;font-size:12px;margin:30px 0 15px 0;min-height:24px">
                    <tbody>
                      <tr>
                        <td>
                          <p style="font-size:14px;line-height:24px;background:#fafafa;padding-left:10px;font-weight:500;margin:0">Power Readings</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tbody>
                      <tr>
                        <td>
                          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                            <tbody style="width:100%">
                              <tr style="width:100%">
                                <td style="padding-left:22px">
                                  <p style="font-size:12px;line-height:1.4;font-weight:600;margin:0;padding:0">MUX Power 1: ${muxPower1} kWh</p>
                                  <p style="font-size:12px;line-height:1.4;font-weight:600;margin:0;padding:0">MUX Power 2: ${muxPower2} kWh</p>
                                  <p style="font-size:12px;line-height:1.4;font-weight:600;margin:0;padding:0">MUX Power 3: ${muxPower3} kWh</p>
                                  <p style="font-size:12px;line-height:1.4;font-weight:600;margin:0;padding:0">MUX Power 4: ${muxPower4} kWh</p>
                                  <p style="font-size:12px;line-height:1.4;font-weight:600;margin:0;padding:0">MUX Power 5: ${muxPower5} kWh</p>
                                  <p style="font-size:12px;line-height:1.4;font-weight:600;margin:0;padding:0">MUX Power 6: ${muxPower6} kWh</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <hr style="width:100%;border:none;border-top:1px solid #eaeaea;margin:30px 0 0 0" />
                  
                  <table align="right" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tbody>
                      <tr>
                        <td>
                          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                            <tbody style="width:100%">
                              <tr style="width:100%">
                                <td align="right" style="display:table-cell">
                                  <p style="font-size:10px;line-height:24px;margin:0;color:rgb(102,102,102);font-weight:600;padding:0px 30px 0px 0px;text-align:right">TOTAL MUX POWER</p>
                                </td>
                                <td style="min-height:48px;padding-top:48px;border-left:1px solid;border-color:rgb(238,238,238)"></td>
                                <td style="display:table-cell;width:90px">
                                  <p style="font-size:16px;line-height:24px;margin:0px 20px 0px 0px;font-weight:600;white-space:nowrap;text-align:right">${totalMuxPower} kWh</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <hr style="width:100%;border:none;border-top:1px solid #eaeaea;margin:0 0 75px 0" />
                  
                  <p style="font-size:12px;line-height:auto;color:rgb(102,102,102);margin:20px 0;text-align:center">
                    This is an automated power meter report generated by the Thai PBS Engineering Department monitoring system.
                  </p>
                  
                  <p style="font-size:12px;line-height:auto;color:rgb(102,102,102);margin:20px 0;text-align:center">
                    For technical support or questions about this report, please contact the NOC team.
                  </p>
                  
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

    // Try multiple SMTP configurations
    const smtpConfigs = [
      {
        configName: "Optimized",
        host: "xxxxxxxxx",
        port: 587,
        secure: false,
        name: "xxxxxxx", // Specify hostname for HELO command
        auth: {
          user: "xxxx",
          pass: "xxxxx",
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 120000, // 2 minutes
        greetingTimeout: 60000,    // 1 minute
        socketTimeout: 120000,     // 2 minutes
        pool: true,                // Use connection pooling
        maxConnections: 1,         // Limit concurrent connections
        maxMessages: 3,            // Max messages per connection
      },
      {
        configName: "Fallback",
        host: "xxxxxxxx",
        port: 587,
        secure: false,
        name: "xxxxxxx",
        auth: {
          user: "xxxxxxx",
          pass: "xxxxxxx",
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 180000, // 3 minutes
        greetingTimeout: 90000,    // 1.5 minutes
        socketTimeout: 180000,     // 3 minutes
        pool: false,               // No pooling
      },
    ];

    let transporter;
    let lastError;

    // Try each SMTP configuration
    for (const config of smtpConfigs) {
      try {
        console.log(`Trying ${config.configName}...`);
        const { configName, ...transportConfig } = config;
        transporter = nodemailer.createTransport(transportConfig);

        // Test the connection
        await transporter.verify();
        console.log(`✅ Connected using ${config.configName}`);
        break;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Failed with ${config.configName}:`, errorMessage);
        lastError = error;
        transporter = null;
      }
    }

    if (!transporter) {
      const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
      throw new Error(
        `All SMTP configurations failed. Last error: ${errorMessage}`
      );
    }

    const attachments = [];
    if (pdfAttachment) {
      try {
        console.log(`📎 Processing PDF attachment (${pdfAttachment.length} chars base64)`);
        
        // Validate base64 string
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(pdfAttachment)) {
          throw new Error('Invalid base64 format for PDF attachment');
        }
        
        const pdfBuffer = Buffer.from(pdfAttachment, "base64");
        console.log(`📎 PDF buffer created: ${pdfBuffer.length} bytes`);
        
        // Check file size (limit to 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (pdfBuffer.length > maxSize) {
          throw new Error(`PDF file too large: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB (max: 10MB)`);
        }
        
        // Validate PDF header
        if (pdfBuffer.length < 4 || pdfBuffer.toString('ascii', 0, 4) !== '%PDF') {
          throw new Error('Invalid PDF file format');
        }
        
        attachments.push({
          filename: `${stationName}_power_report_${
            new Date().toISOString().split("T")[0]
          }.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        });
        
        console.log(`✅ PDF attachment prepared successfully`);
      } catch (pdfError) {
        console.error('❌ PDF attachment error:', pdfError);
        throw new Error(`PDF attachment processing failed: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
      }
    }

    const options = {
      from: "RRS@thaipbs.or.th",
      to: userTo,
      cc: cc,
      subject: `รายงานค่า Power Meter - ${stationName}`,
      html: emailHtml,
      attachments: attachments,
    };

    // Retry logic for email sending
    let info: any = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(`📧 Sending email (attempt ${retryCount + 1}/${maxRetries})...`);
        console.log(`📋 Email details: To=${userTo}, CC=${cc}, Attachments=${attachments.length}`);
        
        const startTime = Date.now();
        info = await transporter.sendMail(options);
        const duration = Date.now() - startTime;
        console.log(`⏱️ Email sent in ${duration}ms`);
        console.log(`✅ Email sent successfully: ${info.response}`);
        break;
      } catch (sendError) {
        retryCount++;
        const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
        console.log(`❌ Send attempt ${retryCount} failed:`, errorMessage);
        
        if (retryCount >= maxRetries) {
          throw sendError;
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    return NextResponse.json(
      { message: "Email sent successfully", messageId: info?.messageId || "unknown" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email sending error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
