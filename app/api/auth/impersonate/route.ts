import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import ResellerPackage from "@/models/ResellerPackage";
import { generateToken, requireApiKey, authenticateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const apiKeyError = requireApiKey(request);
  if (apiKeyError) return apiKeyError;

  try {
    await dbConnect();

    // 1. Authenticate caller
    let currentUser: any = null;
    try {
      currentUser = await authenticateToken(request);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Strict Security: Only admin & ONLY ibrahimabdullah102008@gmail.com
    if (currentUser.accessRole !== "admin" || currentUser.email !== "ibrahimabdullah102008@gmail.com") {
      return NextResponse.json(
        { error: "Forbidden: Hanya super-admin yang bisa melakukan impersonate." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target User ID is required" },
        { status: 400 }
      );
    }

    // 3. Find target user
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // 4. Generate new token for target user
    const token = generateToken(targetUser._id.toString(), targetUser.accessRole);

    // Get reseller discount if target user has active reseller package
    let resellerDiscount = 0;
    if (
      targetUser.resellerPackageId &&
      targetUser.resellerExpiry &&
      new Date(targetUser.resellerExpiry) > new Date()
    ) {
      try {
        const resellerPackage = await ResellerPackage.findById(targetUser.resellerPackageId);
        if (resellerPackage) {
          resellerDiscount = resellerPackage.discount;
        }
      } catch (error) {
        console.log("Failed to get reseller package:", error);
      }
    }

    const userResponse = {
      id: targetUser._id,
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      email: targetUser.email,
      phone: targetUser.phone,
      countryCode: targetUser.countryCode,
      accessRole: targetUser.accessRole,
      resellerTier: targetUser.resellerTier,
      resellerExpiry: targetUser.resellerExpiry,
      resellerPackageId: targetUser.resellerPackageId,
      spendedMoney: targetUser.spendedMoney,
      diskon: resellerDiscount,
      isVerified: targetUser.isVerified,
      profilePicture: targetUser.profilePicture,
      googleId: targetUser.googleId,
      balance: targetUser.balance || 0,
    };

    const response = NextResponse.json(
      {
        message: `Berhasil impersonate sebagai ${targetUser.email}`,
        user: userResponse,
      },
      { status: 200 }
    );

    // 5. Set new token in cookie (replacing admin's token in their browser)
    const maxAge = 7 * 24 * 60 * 60; // 7 days
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: maxAge,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Impersonate error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat impersonate" },
      { status: 500 }
    );
  }
}
