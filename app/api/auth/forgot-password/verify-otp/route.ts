import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordOtpStore } from "../send-otp/route";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    // Validation
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email dan kode OTP harus diisi" },
        { status: 400 }
      );
    }

    // Get stored OTP
    const storedOTP = forgotPasswordOtpStore.get(email.toLowerCase());

    if (!storedOTP) {
      return NextResponse.json(
        { error: "Kode OTP tidak ditemukan atau sudah kadaluarsa" },
        { status: 400 }
      );
    }

    // Check if expired
    if (Date.now() > storedOTP.expiresAt) {
      forgotPasswordOtpStore.delete(email.toLowerCase());
      return NextResponse.json(
        { error: "Kode OTP sudah kadaluarsa" },
        { status: 400 }
      );
    }

    // Verify OTP
    if (storedOTP.code !== otp) {
      return NextResponse.json(
        { error: "Kode OTP tidak valid" },
        { status: 400 }
      );
    }

    // OTP is valid - DON'T delete it yet, we need it for the reset step
    // Mark it as verified instead by extending its expiry for the reset step
    forgotPasswordOtpStore.set(email.toLowerCase(), {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // Extend 10 more minutes for reset
    });

    return NextResponse.json(
      {
        success: true,
        message: "Kode OTP valid",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify forgot password OTP error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
