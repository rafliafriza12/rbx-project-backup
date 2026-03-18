import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    // Admin only
    try {
      await requireAdmin(request);
    } catch (authError: any) {
      const status = authError.message.includes("Forbidden") ? 403 : 401;
      return NextResponse.json({ error: authError.message }, { status });
    }

    const body = await request.json();
    const { userId, memberRole } = body;

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: "User ID diperlukan" },
        { status: 400 },
      );
    }

    // Find target user
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    // Update member role
    targetUser.memberRole = memberRole || null;
    await targetUser.save();

    const userResponse = {
      id: targetUser._id,
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      email: targetUser.email,
      phone: targetUser.phone,
      countryCode: targetUser.countryCode,
      accessRole: targetUser.accessRole,
      memberRole: targetUser.memberRole,
      spendedMoney: targetUser.spendedMoney,
      isVerified: targetUser.isVerified,
    };

    return NextResponse.json(
      {
        message: "Role member berhasil diperbarui",
        user: userResponse,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Update member role error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
