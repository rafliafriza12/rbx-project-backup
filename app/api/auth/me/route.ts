import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Ensure Role model is loaded
    console.log("Role model loaded:", !!Role);

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

    // Manually populate memberRole if exists
    let memberRole = null;
    if (user.memberRole) {
      try {
        memberRole = await Role.findById(user.memberRole);
      } catch (error) {
        console.log("Failed to populate memberRole:", error);
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
      memberRole: memberRole,
      spendedMoney: user.spendedMoney,
      diskon: memberRole ? memberRole.diskon : 0, // Get discount from memberRole
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
