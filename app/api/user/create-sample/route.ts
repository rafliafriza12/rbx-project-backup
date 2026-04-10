import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: "john.doe@example.com" });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: "Sample user already exists",
        data: {
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
        },
      });
    }

    // Create sample user
    const sampleUser = new User({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "81234567890",
      countryCode: "+62",
      password: "hashedpassword123", // In real app, hash this properly
      accessRole: "user",
      memberRole: "premium",
      spendedMoney: 1500000,
      diskon: 5,
      isVerified: true,
    });

    await sampleUser.save();

    return NextResponse.json({
      success: true,
      message: "Sample user created successfully",
      data: {
        id: sampleUser._id,
        email: sampleUser.email,
        firstName: sampleUser.firstName,
        lastName: sampleUser.lastName,
      },
    });
  } catch (error) {
    console.error("Error creating sample user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create sample user",
      },
      { status: 500 }
    );
  }
}
