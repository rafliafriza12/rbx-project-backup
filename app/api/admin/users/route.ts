import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";
import { verifyToken, hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

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

    // Get admin user
    const adminUser = await User.findById(decoded.userId);

    if (!adminUser || adminUser.accessRole !== "admin") {
      return NextResponse.json(
        {
          error: "Akses ditolak. Hanya admin yang dapat melihat data pengguna.",
        },
        { status: 403 }
      );
    }

    // Get URL params for pagination and search
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const role = url.searchParams.get("role") || "";

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.accessRole = role;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get users with pagination and populate memberRole
    const users = await User.find(query)
      .select("-password")
      .populate("memberRole", "member diskon description isActive")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    const usersResponse = users.map((user) => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode,
      accessRole: user.accessRole,
      memberRole: user.memberRole,
      spendedMoney: user.spendedMoney,
      isVerified: user.isVerified,
      googleId: user.googleId,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json(
      {
        message: "Data pengguna berhasil diambil",
        users: usersResponse,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get users error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

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

    // Get admin user
    const adminUser = await User.findById(decoded.userId);

    if (!adminUser || adminUser.accessRole !== "admin") {
      return NextResponse.json(
        {
          error: "Akses ditolak. Hanya admin yang dapat membuat pengguna.",
        },
        { status: 403 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      countryCode,
      password,
      accessRole,
      memberRole,
    } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Semua field wajib harus diisi" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user data
    const userData: any = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accessRole: accessRole || "user",
    };

    // Add optional fields if provided
    if (phone) userData.phone = phone;
    if (countryCode) userData.countryCode = countryCode;
    if (memberRole) userData.memberRole = memberRole;

    // Create new user
    const newUser = new User(userData);
    await newUser.save();

    // Populate memberRole for response
    await newUser.populate("memberRole", "member diskon description isActive");

    const userResponse = {
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phone,
      countryCode: newUser.countryCode,
      accessRole: newUser.accessRole,
      memberRole: newUser.memberRole,
      spendedMoney: newUser.spendedMoney,
      isVerified: newUser.isVerified,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    return NextResponse.json(
      {
        message: "Pengguna berhasil dibuat",
        user: userResponse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create user error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
