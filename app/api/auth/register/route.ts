import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import {
  hashPassword,
  validateEmail,
  validatePhone,
  validatePassword,
  generateToken,
} from "@/lib/auth";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      countryCode,
      password,
      confirmPassword,
    } = body;

    // Validation
    if (
      !firstName ||
      !email ||
      !phone ||
      !countryCode ||
      !password ||
      !confirmPassword
    ) {
      return NextResponse.json(
        { error: "Field yang wajib diisi belum lengkap" },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      );
    }

    if (!validatePhone(phone)) {
      return NextResponse.json(
        { error: "Format nomor handphone tidak valid" },
        { status: 400 }
      );
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Password dan konfirmasi password tidak cocok" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: phone, countryCode: countryCode },
      ],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email sudah terdaftar" },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: "Nomor handphone sudah terdaftar" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = new User({
      firstName,
      lastName: lastName || "", // Default to empty string if not provided
      email: email.toLowerCase(),
      phone,
      countryCode,
      password: hashedPassword,
      accessRole: "user", // Default value
      spendedMoney: 0, // Default value
      isVerified: false,
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id.toString());

    // Return success response (exclude password)
    const userResponse = {
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phone,
      countryCode: newUser.countryCode,
      accessRole: newUser.accessRole,
      resellerTier: newUser.resellerTier,
      resellerExpiry: newUser.resellerExpiry,
      resellerPackageId: newUser.resellerPackageId,
      spendedMoney: newUser.spendedMoney,
      diskon: 0, // New users don't have reseller package, so no discount
      isVerified: newUser.isVerified,
      profilePicture: newUser.profilePicture,
      googleId: newUser.googleId,
    };

    const response = NextResponse.json(
      {
        message: "Pendaftaran berhasil",
        user: userResponse,
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      const message =
        field === "email" ? "Email sudah terdaftar" : "Data sudah terdaftar";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
