import { NextRequest, NextResponse } from "next/server";
import User, { IUser } from "@/models/User";
import ResellerPackage from "@/models/ResellerPackage";
import dbConnect from "@/lib/mongodb";
import { authenticateToken, requireApiKey } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    requireApiKey(request);
    await dbConnect();

    // Authenticate user from token — never trust userId from query params
    const currentUser = await authenticateToken(request);
    const user: IUser | null = await User.findById(currentUser._id).select(
      "-password",
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      );
    }

    // Calculate discount from reseller package
    let diskon = 0;
    if (
      user.resellerPackageId &&
      user.resellerExpiry &&
      new Date(user.resellerExpiry) > new Date()
    ) {
      const resellerPackage = await ResellerPackage.findById(
        user.resellerPackageId,
      );
      if (resellerPackage && resellerPackage.isActive) {
        diskon = resellerPackage.discount;
      }
    }

    // Calculate additional stats - in real app, get from transactions collection
    const totalTransactions = Math.floor(user.spendedMoney / 50000); // Mock calculation

    const profileData = {
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
      diskon,
      isVerified: user.isVerified,
      memberSince: user.createdAt,
      totalTransactions,
      avatar: `/char${Math.floor(Math.random() * 4) + 1}.png`, // Random avatar
    };

    return NextResponse.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch profile",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireApiKey(request);
    await dbConnect();

    // Authenticate user from token
    const currentUser = await authenticateToken(request);

    const body = await request.json();
    const { firstName, lastName, phone, countryCode } = body;
    // NOTE: userId and email from body are intentionally ignored to prevent IDOR

    // Validate input - only firstName is required
    if (!firstName) {
      return NextResponse.json(
        {
          success: false,
          error: "First name is required",
        },
        { status: 400 },
      );
    }

    // Validate phone format if provided
    if (phone && !/^\d{8,15}$/.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number must be 8-15 digits",
        },
        { status: 400 },
      );
    }

    // Find user from token — do not accept userId/email from body
    const user = await User.findById(currentUser._id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      );
    }

    // Update user data
    const updateData: Partial<IUser> = {
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : "", // Default to empty string if not provided
    };

    if (phone) {
      updateData.phone = phone.trim();
    }

    if (countryCode) {
      updateData.countryCode = countryCode.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update user",
        },
        { status: 500 },
      );
    }

    // Calculate discount from reseller package
    let diskon = 0;
    if (
      updatedUser.resellerPackageId &&
      updatedUser.resellerExpiry &&
      new Date(updatedUser.resellerExpiry) > new Date()
    ) {
      const resellerPackage = await ResellerPackage.findById(
        updatedUser.resellerPackageId,
      );
      if (resellerPackage && resellerPackage.isActive) {
        diskon = resellerPackage.discount;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        countryCode: updatedUser.countryCode,
        accessRole: updatedUser.accessRole,
        resellerTier: updatedUser.resellerTier,
        resellerExpiry: updatedUser.resellerExpiry,
        resellerPackageId: updatedUser.resellerPackageId,
        spendedMoney: updatedUser.spendedMoney,
        diskon,
        isVerified: updatedUser.isVerified,
      },
    });
  } catch (error: any) {
    console.error("Profile update error:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      return NextResponse.json(
        {
          success: false,
          error: errorMessages.join(", "),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile",
      },
      { status: 500 },
    );
  }
}
