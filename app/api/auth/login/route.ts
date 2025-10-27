import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import ResellerPackage from "@/models/ResellerPackage";
import { comparePassword, generateToken, validateEmail } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password harus diisi" },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Auto-deactivate expired reseller tier on login
    if (
      user.resellerTier &&
      user.resellerExpiry &&
      new Date(user.resellerExpiry) < new Date()
    ) {
      console.log(
        `🔄 Auto-deactivating expired reseller for user ${user.email}: ` +
          `Tier ${user.resellerTier} expired on ${user.resellerExpiry}`
      );

      user.resellerTier = null;
      user.resellerExpiry = null;
      user.resellerPackageId = null;
      await user.save();

      console.log(`✅ Reseller tier deactivated for user ${user.email}`);
    }

    // Get reseller discount if user has active reseller package
    let resellerDiscount = 0;
    if (
      user.resellerPackageId &&
      user.resellerExpiry &&
      new Date(user.resellerExpiry) > new Date()
    ) {
      try {
        const resellerPackage = await ResellerPackage.findById(
          user.resellerPackageId
        );
        if (resellerPackage) {
          resellerDiscount = resellerPackage.discount;
        }
      } catch (error) {
        console.log("Failed to get reseller package:", error);
      }
    }

    // Generate token
    const token = generateToken(user._id.toString());

    // Return success response (exclude password)
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode,
      accessRole: user.accessRole,
      resellerTier: user.resellerTier,
      resellerExpiry: user.resellerExpiry,
      resellerPackageId: user.resellerPackageId,
      spendedMoney: user.spendedMoney,
      diskon: resellerDiscount, // Get discount from reseller package
      isVerified: user.isVerified,
      profilePicture: user.profilePicture,
      googleId: user.googleId,
    };

    const response = NextResponse.json(
      {
        message: "Login berhasil",
        user: userResponse,
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days if remember me, 7 days otherwise

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: maxAge,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
