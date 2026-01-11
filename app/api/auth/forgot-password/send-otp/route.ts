import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Settings from "@/models/Settings";
import { validateEmail } from "@/lib/auth";
import nodemailer from "nodemailer";

// Store OTPs temporarily for forgot password (separate from registration OTPs)
const forgotPasswordOtpStore = new Map<
  string,
  { code: string; expiresAt: number }
>();

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email } = body;

    // Validation
    if (!email) {
      return NextResponse.json({ error: "Email harus diisi" }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      return NextResponse.json(
        { error: "Email tidak terdaftar" },
        { status: 400 }
      );
    }

    // Check if user registered with Google OAuth (no password)
    if (existingUser.googleId && !existingUser.password) {
      return NextResponse.json(
        {
          error:
            "Akun ini terdaftar dengan Google. Silakan login menggunakan Google.",
        },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    forgotPasswordOtpStore.set(email.toLowerCase(), { code: otp, expiresAt });

    // Get email settings from database
    const settings = await Settings.findOne();
    if (!settings || !settings.emailUser || !settings.emailPassword) {
      return NextResponse.json(
        { error: "Konfigurasi email belum diatur. Silakan hubungi admin." },
        { status: 500 }
      );
    }

    // Send OTP via email
    try {
      const transporter = nodemailer.createTransport({
        host: settings.emailHost || "smtp.gmail.com",
        port: settings.emailPort || 587,
        secure: settings.emailSecure || false,
        auth: {
          user: settings.emailUser,
          pass: settings.emailPassword,
        },
      });

      const mailOptions = {
        from: `"${settings.emailFromName || "RBXNET"}" <${
          settings.emailFromAddress || settings.emailUser
        }>`,
        to: email,
        subject: "Reset Password - RBXNET",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reset Password OTP</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0f172a;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- Header with Logo -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); width: 80px; height: 80px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);">
                    <span style="font-size: 40px;">🔐</span>
                  </div>
                </div>

                <!-- Main Card -->
                <div style="background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; padding: 40px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.1);">
                  
                  <!-- Greeting -->
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 10px 0; text-align: center;">
                    Reset Password 🔒
                  </h1>
                  
                  <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                    Kami menerima permintaan untuk reset password akun <span style="color: #ec4899; font-weight: bold;">RBXNET</span> Anda
                  </p>

                  <!-- OTP Box -->
                  <div style="background: rgba(236, 72, 153, 0.1); border: 2px solid rgba(236, 72, 153, 0.3); border-radius: 15px; padding: 30px; text-align: center; margin: 30px 0;">
                    <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">
                      Kode Verifikasi OTP
                    </p>
                    <div style="font-size: 42px; font-weight: bold; color: #ec4899; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 0 0 20px rgba(236, 72, 153, 0.5);">
                      ${otp}
                    </div>
                    <p style="color: #64748b; font-size: 13px; margin: 15px 0 0 0;">
                      ⏱️ Berlaku selama 5 menit
                    </p>
                  </div>

                  <!-- Instructions -->
                  <div style="background: rgba(139, 92, 246, 0.1); border-left: 3px solid #8b5cf6; border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <p style="color: #e2e8f0; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">
                      📌 Petunjuk:
                    </p>
                    <ul style="color: #94a3b8; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li>Masukkan kode OTP di halaman reset password</li>
                      <li>Jangan bagikan kode ini kepada siapapun</li>
                      <li>Kode akan kadaluarsa dalam 5 menit</li>
                    </ul>
                  </div>

                  <!-- Security Warning -->
                  <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 15px; margin: 20px 0;">
                    <p style="color: #fca5a5; font-size: 13px; margin: 0; line-height: 1.6;">
                      ⚠️ <strong>Peringatan Keamanan:</strong> Jika Anda tidak meminta reset password, abaikan email ini dan segera hubungi tim support kami.
                    </p>
                  </div>

                  <!-- Support -->
                  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <p style="color: #64748b; font-size: 13px; margin: 0 0 10px 0;">
                      Butuh bantuan? Hubungi kami:
                    </p>
                    <p style="margin: 5px 0;">
                      <a href="mailto:support@rbxnet.com" style="color: #ec4899; text-decoration: none; font-size: 14px;">
                        📧 support@rbxnet.com
                      </a>
                    </p>
                  </div>

                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #475569; font-size: 12px; margin: 0 0 10px 0;">
                    © ${new Date().getFullYear()} RBXNET. All rights reserved.
                  </p>
                  <p style="color: #334155; font-size: 11px; margin: 0;">
                    Platform terpercaya untuk jasa Robux, Gamepass, dan Joki Roblox
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);

      return NextResponse.json(
        {
          success: true,
          message: "Kode OTP telah dikirim ke email Anda",
        },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return NextResponse.json(
        { error: "Gagal mengirim email OTP. Silakan coba lagi." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Forgot password send OTP error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// Cleanup expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of forgotPasswordOtpStore.entries()) {
    if (data.expiresAt < now) {
      forgotPasswordOtpStore.delete(email);
    }
  }
}, 60000); // Clean up every minute

// Export the OTP store for verification
export { forgotPasswordOtpStore };
