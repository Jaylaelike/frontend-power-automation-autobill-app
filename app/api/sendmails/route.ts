// import { NextResponse } from "next/server";
// import nodemailer from "nodemailer";

// export async function POST(request: Request) {
//   try {
//     const {
//       stationName,
//       lastUpdate,
//       muxPower1,
//       muxPower2,
//       muxPower3,
//       muxPower4,
//       muxPower5,
//       muxPower6,
//       totalMuxPower,
//       userTo,
//       cc,
//       pdfAttachment,
//     } = await request.json();

//     const emailHtml = `
// <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
// <html dir="ltr" lang="en">
// <head>
//   <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
//   <meta name="x-apple-disable-message-reformatting" />
// </head>
// <body style="background-color:#ffffff">
//   <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
//     <tbody>
//       <tr>
//         <td style='font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;background-color:#ffffff'>
//           <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
//             Power Meter Report - ${stationName}
//           </div>
//           <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:100%;margin:0 auto;padding:20px 0 48px;width:660px">
//             <tbody>
//               <tr style="width:100%">
//                 <td>
//                   <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
//                     <tbody>
//                       <tr>
//                         <td>
//                           <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
//                             <tbody style="width:100%">
//                               <tr style="width:100%">
//                                 <td>
//                                   <h1 style="font-size:32px;line-height:24px;font-weight:300;color:#333333;margin-top:16px;margin-bottom:16px">Power Meter Report</h1>
//                                 </td>
//                                 <td align="right" style="display:table-cell">
//                                   <p style="font-size:32px;line-height:24px;font-weight:300;color:#888888;margin-top:16px;margin-bottom:16px">Report</p>
//                                 </td>
//                               </tr>
//                             </tbody>
//                           </table>
//                         </td>
//                       </tr>
//                     </tbody>
//                   </table>
                  
//                   <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;color:rgb(51,51,51);background-color:rgb(250,250,250);border-radius:3px;font-size:12px">
//                     <tbody>
//                       <tr>
//                         <td>
//                           <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="min-height:46px">
//                             <tbody style="width:100%">
//                               <tr style="width:100%">
//                                 <td colspan="2">
//                                   <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
//                                     <tbody>
//                                       <tr>
//                                         <td>
//                                           <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
//                                             <tbody style="width:100%">
//                                               <tr style="width:100%">
//                                                 <td style="padding-left:20px;border-style:solid;border-color:white;border-width:0px 1px 1px 0px;min-height:44px">
//                                                   <p style="font-size:10px;line-height:1.4;margin:0;padding:0;color:rgb(102,102,102)">STATION NAME</p>
//                                                   <p style="font-size:12px;line-height:1.4;margin:0;padding:0">${stationName}</p>
//                                                 </td>
//                                               </tr>
//                                             </tbody>
//                                           </table>
//                                           <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
//                                             <tbody style="width:100%">
//                                               <tr style="width:100%">
//                                                 <td style="padding-left:20px;border-style:solid;border-color:white;border-width:0px 1px 1px 0px;min-height:44px">
//                                                   <p style="font-size:10px;line-height:1.4;margin:0;padding:0;color:rgb(102,102,102)">LAST UPDATE</p>
//                                                   <p style="font-size:12px;line-height:1.4;margin:0;padding:0">${lastUpdate}</p>
//                                                 </td>
//                                                 <td style="padding-left:20px;border-style:solid;border-color:white;border-width:0px 1px 1px 0px;min-height:44px">
//                                                   <p style="font-size:10px;line-height:1.4;margin:0;padding:0;color:rgb(102,102,102)">REPORT DATE</p>
//                                                   <p style="font-size:12px;line-height:1.4;margin:0;padding:0">${new Date().toLocaleDateString()}</p>
//                                                 </td>
//                                               </tr>
//                                             </tbody>
//                                           </table>
//                                         </td>
//                                       </tr>
//                                     </tbody>
//                                   </table>
//                                 </td>
//                               </tr>
//                             </tbody>
//                           </table>
//                         </td>
//                       </tr>
//                     </tbody>
//                   </table>
                  
//                   <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;color:rgb(51,51,51);background-color:rgb(250,250,250);border-radius:3px;font-size:12px;margin:30px 0 15px 0;min-height:24px">
//                     <tbody>
//                       <tr>
//                         <td>
//                           <p style="font-size:14px;line-height:24px;background:#fafafa;padding-left:10px;font-weight:500;margin:0">Power Readings</p>
//                         </td>
//                       </tr>
//                     </tbody>
//                   </table>
                  
//                   <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
//                     <tbody>
//                       <tr>
//                         <td>
//                           <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
//                             <tbody style="width:100%">
//                               <tr style="width:100%">
//                                 <td style="padding-left:22px">
//                                   <p style="font-size:12px;line-height:1.4;font-weight:600;margin:0;padding:0">MUX Power 1: ${muxPower1} kWh</p>
//                                   <p style="font-size:12px;line-height:1.4;font-weight:600;margin:0;padding:0">MUX Power 2: ${muxPower2} kWh</p>
//                                   <p style="font-size:12px;line-height:1.4;font-weight:600;margin:0;padding:0">MUX Power 3: ${muxPower3} kWh</p>
//                                   <p style="font-size:12px;line-height:1.4;font-weight:600;margin:0;padding:0">MUX Power 4: ${muxPower4} kWh</p>
//                                   <p style="font-size:12px;line-height:1.4;font-weight:600;margin:0;padding:0">MUX Power 5: ${muxPower5} kWh</p>
//                                   <p style="font-size:12px;line-height:1.4;font-weight:600;margin:0;padding:0">MUX Power 6: ${muxPower6} kWh</p>
//                                 </td>
//                               </tr>
//                             </tbody>
//                           </table>
//                         </td>
//                       </tr>
//                     </tbody>
//                   </table>
                  
//                   <hr style="width:100%;border:none;border-top:1px solid #eaeaea;margin:30px 0 0 0" />
                  
//                   <table align="right" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
//                     <tbody>
//                       <tr>
//                         <td>
//                           <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
//                             <tbody style="width:100%">
//                               <tr style="width:100%">
//                                 <td align="right" style="display:table-cell">
//                                   <p style="font-size:10px;line-height:24px;margin:0;color:rgb(102,102,102);font-weight:600;padding:0px 30px 0px 0px;text-align:right">TOTAL MUX POWER</p>
//                                 </td>
//                                 <td style="min-height:48px;padding-top:48px;border-left:1px solid;border-color:rgb(238,238,238)"></td>
//                                 <td style="display:table-cell;width:90px">
//                                   <p style="font-size:16px;line-height:24px;margin:0px 20px 0px 0px;font-weight:600;white-space:nowrap;text-align:right">${totalMuxPower} kWh</p>
//                                 </td>
//                               </tr>
//                             </tbody>
//                           </table>
//                         </td>
//                       </tr>
//                     </tbody>
//                   </table>
                  
//                   <hr style="width:100%;border:none;border-top:1px solid #eaeaea;margin:0 0 75px 0" />
                  
//                   <p style="font-size:12px;line-height:auto;color:rgb(102,102,102);margin:20px 0;text-align:center">
//                     This is an automated power meter report generated by the Thai PBS Engineering Department monitoring system.
//                   </p>
                  
//                   <p style="font-size:12px;line-height:auto;color:rgb(102,102,102);margin:20px 0;text-align:center">
//                     For technical support or questions about this report, please contact the NOC team.
//                   </p>
                  
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </td>
//       </tr>
//     </tbody>
//   </table>
// </body>
// </html>`;

//     // Try multiple SMTP configurations
//         const smtpConfigs = [
//       {
//         configName: "Thai PBS SMTP (Port 587) - Optimized",
//         host: "webmail.thaipbs.or.th",
//         port: 587,
//         secure: false,
//         name: "thaipbs.or.th", // Specify hostname for HELO command
//         auth: {
//           user: "RRS@thaipbs.or.th",
//           pass: "rR$%^&2025",
//         },
//         tls: {
//           rejectUnauthorized: false,
//         },
//         connectionTimeout: 120000, // 2 minutes
//         greetingTimeout: 60000,    // 1 minute
//         socketTimeout: 120000,     // 2 minutes
//         pool: true,                // Use connection pooling
//         maxConnections: 1,         // Limit concurrent connections
//         maxMessages: 3,            // Max messages per connection
//       },
//       {
//         configName: "Thai PBS SMTP (Port 587) - Fallback",
//         host: "webmail.thaipbs.or.th",
//         port: 587,
//         secure: false,
//         name: "thaipbs.or.th",
//         auth: {
//           user: "RRS@thaipbs.or.th",
//           pass: "rR$%^&2025",
//         },
//         tls: {
//           rejectUnauthorized: false,
//         },
//         connectionTimeout: 180000, // 3 minutes
//         greetingTimeout: 90000,    // 1.5 minutes
//         socketTimeout: 180000,     // 3 minutes
//         pool: false,               // No pooling
//       },
//     ];

//     let transporter;
//     let lastError;

//     // Try each SMTP configuration
//     for (const config of smtpConfigs) {
//       try {
//         console.log(`Trying ${config.configName}...`);
//         const { configName, ...transportConfig } = config;
//         transporter = nodemailer.createTransport(transportConfig);

//         // Test the connection
//         await transporter.verify();
//         console.log(`✅ Connected using ${config.configName}`);
//         break;
//       } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : String(error);
//         console.log(`❌ Failed with ${config.configName}:`, errorMessage);
//         lastError = error;
//         transporter = null;
//       }
//     }

//     if (!transporter) {
//       const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
//       throw new Error(
//         `All SMTP configurations failed. Last error: ${errorMessage}`
//       );
//     }

//     const attachments = [];
//     if (pdfAttachment) {
//       try {
//         console.log(`📎 Processing PDF attachment (${pdfAttachment.length} chars base64)`);
        
//         // Validate base64 string
//         if (!/^[A-Za-z0-9+/]*={0,2}$/.test(pdfAttachment)) {
//           throw new Error('Invalid base64 format for PDF attachment');
//         }
        
//         const pdfBuffer = Buffer.from(pdfAttachment, "base64");
//         console.log(`📎 PDF buffer created: ${pdfBuffer.length} bytes`);
        
//         // Check file size (limit to 10MB)
//         const maxSize = 10 * 1024 * 1024; // 10MB
//         if (pdfBuffer.length > maxSize) {
//           throw new Error(`PDF file too large: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB (max: 10MB)`);
//         }
        
//         // Validate PDF header
//         if (pdfBuffer.length < 4 || pdfBuffer.toString('ascii', 0, 4) !== '%PDF') {
//           throw new Error('Invalid PDF file format');
//         }
        
//         attachments.push({
//           filename: `${stationName}_power_report_${
//             new Date().toISOString().split("T")[0]
//           }.pdf`,
//           content: pdfBuffer,
//           contentType: "application/pdf",
//         });
        
//         console.log(`✅ PDF attachment prepared successfully`);
//       } catch (pdfError) {
//         console.error('❌ PDF attachment error:', pdfError);
//         throw new Error(`PDF attachment processing failed: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
//       }
//     }

//     const options = {
//       from: "RRS@thaipbs.or.th",
//       to: userTo,
//       cc: cc,
//       subject: `รายงานค่า Power Meter - ${stationName}`,
//       html: emailHtml,
//       attachments: attachments,
//     };

//     // Retry logic for email sending
//     let info: any = null;
//     let retryCount = 0;
//     const maxRetries = 3;

//     while (retryCount < maxRetries) {
//       try {
//         console.log(`📧 Sending email (attempt ${retryCount + 1}/${maxRetries})...`);
//         console.log(`📋 Email details: To=${userTo}, CC=${cc}, Attachments=${attachments.length}`);
        
//         const startTime = Date.now();
//         info = await transporter.sendMail(options);
//         const duration = Date.now() - startTime;
//         console.log(`⏱️ Email sent in ${duration}ms`);
//         console.log(`✅ Email sent successfully: ${info.response}`);
//         break;
//       } catch (sendError) {
//         retryCount++;
//         const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
//         console.log(`❌ Send attempt ${retryCount} failed:`, errorMessage);
        
//         if (retryCount >= maxRetries) {
//           throw sendError;
//         }
        
//         // Wait before retry (exponential backoff)
//         const waitTime = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
//         console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
//         await new Promise(resolve => setTimeout(resolve, waitTime));
//       }
//     }

//     return NextResponse.json(
//       { message: "Email sent successfully", messageId: info?.messageId || "unknown" },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Email sending error:", error);
//     const errorMessage = error instanceof Error ? error.message : "Failed to send email";
//     return NextResponse.json(
//       { message: errorMessage },
//       { status: 500 }
//     );
//   }
// }



//Test with emailjs : due to smtp hava a ploblem !!!
import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

// Function to compress PDF
async function compressPDF(base64Data: string, targetSizeMB: number = 1): Promise<string> {
  try {
    console.log(`🗜️ Starting PDF compression...`);
    
    const pdfBuffer = Buffer.from(base64Data, "base64");
    const originalSizeMB = pdfBuffer.length / (1024 * 1024);
    console.log(`📊 Original size: ${originalSizeMB.toFixed(2)} MB`);
    
    if (originalSizeMB <= targetSizeMB) {
      console.log(`✅ PDF already under ${targetSizeMB}MB, no compression needed`);
      return base64Data;
    }
    
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
    });
    
    const pageCount = pdfDoc.getPageCount();
    console.log(`📄 PDF has ${pageCount} pages`);
    
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });
    
    const compressedBuffer = Buffer.from(compressedPdfBytes);
    const compressedSizeMB = compressedBuffer.length / (1024 * 1024);
    const compressionRatio = ((1 - compressedSizeMB / originalSizeMB) * 100).toFixed(1);
    
    console.log(`📊 Compressed size: ${compressedSizeMB.toFixed(2)} MB`);
    console.log(`📉 Compression ratio: ${compressionRatio}%`);
    
    if (compressedSizeMB > targetSizeMB) {
      console.log(`⚠️ Still over ${targetSizeMB}MB, applying aggressive compression...`);
      
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(pdfDoc, Array.from({ length: pageCount }, (_, i) => i));
      pages.forEach(page => newPdf.addPage(page));
      
      const aggressiveBytes = await newPdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 100,
      });
      
      const aggressiveBuffer = Buffer.from(aggressiveBytes);
      const aggressiveSizeMB = aggressiveBuffer.length / (1024 * 1024);
      
      console.log(`📊 Aggressively compressed size: ${aggressiveSizeMB.toFixed(2)} MB`);
      
      const finalBuffer = aggressiveSizeMB < compressedSizeMB ? aggressiveBuffer : compressedBuffer;
      return finalBuffer.toString("base64");
    }
    
    return compressedBuffer.toString("base64");
  } catch (error) {
    console.error('❌ PDF compression error:', error);
    console.log('⚠️ Returning original PDF due to compression error');
    return base64Data;
  }
}

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
      // Modbus channel labels
      modbusLabel1,
      modbusLabel2,
      modbusLabel3,
      modbusLabel4,
      modbusLabel5,
      modbusLabel6,
      userTo,
      cc,
      pdfAttachment,
    } = await request.json();

    // Format report date in Bangkok timezone
    const reportDate = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Asia/Bangkok'
    });

    // Format last update to Bangkok timezone (UTC+7)
    const formatLastUpdate = (lastUpdate: string) => {
      try {
        // Try to parse the date if it's in ISO format or other standard formats
        const date = new Date(lastUpdate);
        
        // Check if date is valid
        if (!isNaN(date.getTime())) {
          // Format as: January 12, 2026 at 2:30 PM (Bangkok time UTC+7)
          return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Bangkok'
          });
        }
        
        // If not a valid date, return as is
        return lastUpdate;
      } catch (error) {
        // If parsing fails, return original
        return lastUpdate;
      }
    };

    const formattedLastUpdate = formatLastUpdate(lastUpdate);

    // Helper function to get modbus label with fallback
    const getModbusLabel = (index: number, modbusLabel: string | undefined | null): string => {
      if (modbusLabel && modbusLabel.trim()) {
        return `MUX ${index} - ${modbusLabel}`;
      }
      return `MUX Power ${index}`;
    };

    // Generate labels for each channel
    const muxLabel1 = getModbusLabel(1, modbusLabel1);
    const muxLabel2 = getModbusLabel(2, modbusLabel2);
    const muxLabel3 = getModbusLabel(3, modbusLabel3);
    const muxLabel4 = getModbusLabel(4, modbusLabel4);
    const muxLabel5 = getModbusLabel(5, modbusLabel5);
    const muxLabel6 = getModbusLabel(6, modbusLabel6);

    // Log received data for debugging
    console.log('📥 Received data:', {
      stationName,
      lastUpdate,
      formattedLastUpdate,
      muxPower1, muxLabel1,
      muxPower2, muxLabel2,
      muxPower3, muxLabel3,
      muxPower4, muxLabel4,
      muxPower5, muxLabel5,
      muxPower6, muxLabel6,
      totalMuxPower,
      userTo,
      cc
    });

    // Process PDF attachment if provided
    let processedPdfBase64 = null;
    let pdfFilename = null;
    
    if (pdfAttachment) {
      try {
        console.log(`📎 Processing PDF attachment...`);
        
        // Validate base64
        const cleanBase64 = pdfAttachment.replace(/\s/g, '');
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
          throw new Error('Invalid base64 format for PDF attachment');
        }
        
        const originalBuffer = Buffer.from(cleanBase64, "base64");
        const originalSizeMB = originalBuffer.length / (1024 * 1024);
        console.log(`📊 Original PDF size: ${originalSizeMB.toFixed(2)} MB`);
        
        // Validate PDF
        if (originalBuffer.length < 4 || originalBuffer.toString('ascii', 0, 4) !== '%PDF') {
          throw new Error('Invalid PDF file format');
        }
        
        if (originalSizeMB > 50) {
          throw new Error(`PDF file too large: ${originalSizeMB.toFixed(2)}MB (max: 50MB)`);
        }
        
        // Compress if needed
        let finalBase64 = cleanBase64;
        if (originalSizeMB > 0.8) { // Compress if over 800KB
          console.log(`🗜️ Compressing PDF...`);
          finalBase64 = await compressPDF(cleanBase64, 0.8);
          
          const compressedBuffer = Buffer.from(finalBase64, "base64");
          const compressedSizeMB = compressedBuffer.length / (1024 * 1024);
          console.log(`✅ Compressed to: ${compressedSizeMB.toFixed(2)} MB`);
        }
        
        processedPdfBase64 = finalBase64;
        pdfFilename = `${stationName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split("T")[0]}.pdf`;
        
        console.log(`✅ PDF ready: ${pdfFilename}`);
      } catch (pdfError) {
        console.error('❌ PDF processing error:', pdfError);
        // Continue without attachment rather than failing completely
        console.log('⚠️ Sending email without PDF attachment');
      }
    }

    // Create minimal EmailJS payload with individual variables
    const emailJsPayload: any = {
      service_id: process.env.EMAILJS_SERVICE_ID || '',
      template_id: process.env.EMAILJS_TEMPLATE_ID || '',
      user_id: process.env.EMAILJS_PUBLIC_KEY || '',
      template_params: {
        to_email: userTo,
        from_name: "Thai PBS Engineering",
        subject: `Power Meter Report - ${stationName}`,
        
        // Station and date info
        station_name: String(stationName || 'N/A'),
        last_update: String(formattedLastUpdate || 'N/A'),
        report_date: reportDate,
        
        // Modbus channel labels
        mux_label_1: String(muxLabel1),
        mux_label_2: String(muxLabel2),
        mux_label_3: String(muxLabel3),
        mux_label_4: String(muxLabel4),
        mux_label_5: String(muxLabel5),
        mux_label_6: String(muxLabel6),
        
        // Individual MUX power readings (ensure they're strings)
        mux_power_1: String(muxPower1 !== undefined && muxPower1 !== null ? muxPower1 : '0'),
        mux_power_2: String(muxPower2 !== undefined && muxPower2 !== null ? muxPower2 : '0'),
        mux_power_3: String(muxPower3 !== undefined && muxPower3 !== null ? muxPower3 : '0'),
        mux_power_4: String(muxPower4 !== undefined && muxPower4 !== null ? muxPower4 : '0'),
        mux_power_5: String(muxPower5 !== undefined && muxPower5 !== null ? muxPower5 : '0'),
        mux_power_6: String(muxPower6 !== undefined && muxPower6 !== null ? muxPower6 : '0'),
        
        // Total power
        total_mux_power: String(totalMuxPower !== undefined && totalMuxPower !== null ? totalMuxPower : '0'),
      }
    };

    // Log template params for debugging
    console.log('📤 Sending template params:', JSON.stringify(emailJsPayload.template_params, null, 2));

    // Add CC if provided
    if (cc && typeof cc === 'string' && cc.trim()) {
      emailJsPayload.template_params.cc = cc;
    } else if (Array.isArray(cc) && cc.length > 0) {
      emailJsPayload.template_params.cc = cc.join(', ');
    }

    // Add private key if available
    if (process.env.EMAILJS_PRIVATE_KEY) {
      emailJsPayload.accessToken = process.env.EMAILJS_PRIVATE_KEY;
    }

    // Try to add PDF if it's small enough
    if (processedPdfBase64 && pdfFilename) {
      const payloadWithoutPdf = JSON.stringify(emailJsPayload);
      const pdfSizeKB = (processedPdfBase64.length / 1024);
      const currentSizeKB = (payloadWithoutPdf.length / 1024);
      const totalSizeKB = currentSizeKB + pdfSizeKB;
      
      console.log(`📦 Size check: Payload=${currentSizeKB.toFixed(1)}KB + PDF=${pdfSizeKB.toFixed(1)}KB = ${totalSizeKB.toFixed(1)}KB`);
      
      if (totalSizeKB < 40) { // Safe limit under 50KB
        emailJsPayload.template_params.attachment = processedPdfBase64;
        emailJsPayload.template_params.attachment_name = pdfFilename;
        console.log(`✅ PDF included (total: ${totalSizeKB.toFixed(1)}KB)`);
      } else {
        console.log(`⚠️ PDF too large (${totalSizeKB.toFixed(1)}KB), skipping attachment`);
        emailJsPayload.template_params.message += '\n\n⚠️ Note: PDF report was too large to attach.';
      }
    }

    // Send email with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let lastError;

    while (retryCount < maxRetries) {
      try {
        console.log(`📧 Sending email (attempt ${retryCount + 1}/${maxRetries})...`);
        console.log(`📋 To: ${userTo}${cc ? `, CC: ${cc}` : ''}`);
        
        const startTime = Date.now();
        
        const emailJsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailJsPayload),
        });

        const duration = Date.now() - startTime;

        if (!emailJsResponse.ok) {
          const errorText = await emailJsResponse.text();
          throw new Error(`EmailJS error ${emailJsResponse.status}: ${errorText}`);
        }

        const responseText = await emailJsResponse.text();
        console.log(`⏱️ Sent in ${duration}ms`);
        console.log(`✅ Email sent successfully`);
        
        return NextResponse.json(
          { 
            message: "Email sent successfully via EmailJS", 
            status: 'sent',
            service: 'EmailJS',
            recipient: userTo
          },
          { status: 200 }
        );
        
      } catch (sendError) {
        retryCount++;
        lastError = sendError;
        const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
        console.log(`❌ Attempt ${retryCount} failed: ${errorMessage}`);
        
        if (retryCount >= maxRetries) {
          break;
        }
        
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // If all retries failed
    throw lastError || new Error('Failed to send email after all retries');

  } catch (error) {
    console.error("Email sending error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json(
      { message: errorMessage, error: String(error) },
      { status: 500 }
    );
  }
}