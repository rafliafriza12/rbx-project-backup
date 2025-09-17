import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";
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
    let user = await User.findOne({ email: email.toLowerCase() }).populate(
      "memberRole",
      "member diskon description isActive"
    );

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
        memberRole: null,
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

      // Populate memberRole after save for consistency
      user = await User.findById(user._id).populate(
        "memberRole",
        "member diskon description isActive"
      );
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
      memberRole: user.memberRole,
      spendedMoney: user.spendedMoney,
      diskon: user.memberRole ? (user.memberRole as any).diskon : 0, // Get discount from memberRole
      isVerified: user.isVerified,
      profilePicture: user.profilePicture,
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
