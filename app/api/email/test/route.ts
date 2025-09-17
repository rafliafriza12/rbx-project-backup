import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";
import EmailService from "@/lib/email";

// POST - Test email configuration
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json(
        { error: "Email untuk test diperlukan" },
        { status: 400 }
      );
    }

    // Get current settings
    const settings = await Settings.getSiteSettings();

    // Check if email configuration exists
    if (!settings.emailUser || !settings.emailPassword) {
      return NextResponse.json(
        {
          error:
            "Konfigurasi email tidak lengkap. Silakan atur email user dan password di settings.",
          config: {
            emailUser: !!settings.emailUser,
            emailPassword: !!settings.emailPassword,
            emailHost: settings.emailHost,
            emailPort: settings.emailPort,
          },
        },
        { status: 400 }
      );
    }

    // Send test email
    const testEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Test Email</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .success { color: #10b981; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${settings.siteName || "RBX Store"}</h1>
                <p>Test Konfigurasi Email</p>
            </div>
            <div class="content">
                <h2 class="success">✅ Email Configuration Test Berhasil!</h2>
                <p>Ini adalah email test dari sistem ${
                  settings.siteName || "RBX Store"
                }.</p>
                <p><strong>Waktu Test:</strong> ${new Date().toLocaleString(
                  "id-ID"
                )}</p>
                <p><strong>Email Host:</strong> ${settings.emailHost}</p>
                <p><strong>Email Port:</strong> ${settings.emailPort}</p>
                <p><strong>Email From:</strong> ${settings.emailFromName} &lt;${
      settings.emailFromAddress
    }&gt;</p>
                
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
                
                <p>Jika Anda menerima email ini, berarti konfigurasi email sudah benar dan sistem invoice email sudah siap digunakan.</p>
                
                <p style="margin-top: 30px; font-size: 0.9em; color: #6b7280;">
                    Email ini dikirim secara otomatis oleh sistem. Jangan membalas email ini.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    const emailSent = await EmailService.sendEmail({
      to: testEmail,
      subject: `Test Email Configuration - ${settings.siteName || "RBX Store"}`,
      html: testEmailHtml,
    });

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: "Test email berhasil dikirim",
        sentTo: testEmail,
        config: {
          host: settings.emailHost,
          port: settings.emailPort,
          secure: settings.emailSecure,
          fromName: settings.emailFromName,
          fromAddress: settings.emailFromAddress,
        },
      });
    } else {
      return NextResponse.json(
        {
          error:
            "Gagal mengirim test email. Periksa kembali konfigurasi email.",
          config: {
            host: settings.emailHost,
            port: settings.emailPort,
            secure: settings.emailSecure,
            emailUser: !!settings.emailUser,
            emailPassword: !!settings.emailPassword,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error testing email:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
