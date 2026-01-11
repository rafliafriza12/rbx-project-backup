import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword, validatePassword } from "@/lib/auth";
import { forgotPasswordOtpStore } from "../send-otp/route";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, otp, newPassword, confirmPassword } = body;

    // Validation
    if (!email || !otp || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    if (!validatePassword(newPassword)) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Password dan konfirmasi password tidak cocok" },
        { status: 400 }
      );
    }

    // Verify OTP one more time for security
    const storedOTP = forgotPasswordOtpStore.get(email.toLowerCase());

    if (!storedOTP) {
      return NextResponse.json(
        { error: "Sesi reset password sudah kadaluarsa. Silakan mulai ulang." },
        { status: 400 }
      );
    }

    if (Date.now() > storedOTP.expiresAt) {
      forgotPasswordOtpStore.delete(email.toLowerCase());
      return NextResponse.json(
        { error: "Sesi reset password sudah kadaluarsa. Silakan mulai ulang." },
        { status: 400 }
      );
    }

    if (storedOTP.code !== otp) {
      return NextResponse.json(
        { error: "Verifikasi gagal. Silakan mulai ulang." },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Delete OTP after successful reset
    forgotPasswordOtpStore.delete(email.toLowerCase());

    return NextResponse.json(
      {
        success: true,
        message:
          "Password berhasil direset. Silakan login dengan password baru.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
