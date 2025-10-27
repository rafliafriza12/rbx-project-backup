import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: email.toLowerCase(),
      accessRole: "admin",
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin dengan email ini sudah ada" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin user
    const adminUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone: "08123456789", // Default phone
      countryCode: "+62",
      password: hashedPassword,
      accessRole: "admin",
      resellerTier: 0,
      spendedMoney: 0,
      isVerified: true,
    });

    await adminUser.save();

    return NextResponse.json(
      {
        message: "Admin berhasil dibuat",
        admin: {
          id: adminUser._id,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          email: adminUser.email,
          accessRole: adminUser.accessRole,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create admin error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
