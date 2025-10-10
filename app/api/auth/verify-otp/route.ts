import { NextRequest, NextResponse } from "next/server";
import { otpStore } from "../send-otp/route";

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
    const storedOTP = otpStore.get(email.toLowerCase());

    if (!storedOTP) {
      return NextResponse.json(
        { error: "Kode OTP tidak ditemukan atau sudah kadaluarsa" },
        { status: 400 }
      );
    }

    // Check if expired
    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(email.toLowerCase());
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

    // OTP is valid, delete it from store
    otpStore.delete(email.toLowerCase());

    return NextResponse.json(
      {
        success: true,
        message: "Kode OTP valid",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
