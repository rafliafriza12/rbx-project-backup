import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import ResellerPackage from "@/models/ResellerPackage";
import { generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, name, picture, sub: googleId } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Data Google tidak lengkap" },
        { status: 400 }
      );
    }

    // Find existing user by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // User exists, update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.profilePicture = picture;
        await user.save();
      }
    } else {
      // Create new user
      const [firstName, ...lastNameParts] = name.split(" ");
      const lastName = lastNameParts.join(" ") || firstName;

      const userData: any = {
        firstName,
        lastName,
        email: email.toLowerCase(),
        googleId,
        profilePicture: picture,
        accessRole: "user",
        spendedMoney: 0,
        isVerified: true, // Google accounts are considered verified
      };

      // Don't set phone, countryCode, or password for Google OAuth users
      // Let them use default values and skip validation
      user = new User(userData);

      console.log("Creating Google user with data:", {
        ...userData,
        googleId: googleId ? "exists" : "missing",
      });
      console.log("User before save:", {
        googleId: user.googleId,
        phone: user.phone,
        password: user.password,
        countryCode: user.countryCode,
      });

      // Skip validation for Google OAuth users since we know the data is valid
      await user.save({ validateBeforeSave: false });

      // Refresh user data
      user = await User.findById(user._id);
    }

    // Auto-deactivate expired reseller tier
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
      await user.save({ validateBeforeSave: false });

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
        message: "Login Google berhasil",
        user: userResponse,
      },
      { status: 200 }
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
    console.error("Google login error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
