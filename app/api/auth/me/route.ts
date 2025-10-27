import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import ResellerPackage from "@/models/ResellerPackage";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Ensure ResellerPackage model is loaded
    console.log("ResellerPackage model loaded:", !!ResellerPackage);

    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
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

    return NextResponse.json(
      {
        message: "User authenticated",
        user: userResponse,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Authentication check error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
