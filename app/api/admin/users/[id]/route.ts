import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken, hashPassword } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
          error: "Akses ditolak. Hanya admin yang dapat mengupdate pengguna.",
        },
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
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
      resellerTier,
      resellerExpiry,
      resellerPackageId,
    } = await request.json();

    // Build update data
    const updateData: any = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    // Phone is optional for admin update - allow empty string or actual value
    if (phone !== undefined) {
      updateData.phone = phone.trim() || "";
    }
    if (countryCode !== undefined) {
      updateData.countryCode = countryCode || "";
    }
    if (accessRole) updateData.accessRole = accessRole;

    // For resellerTier: 0 means "no reseller", so set to null
    // Only set if value is between 1-3, otherwise set to null
    if (resellerTier !== undefined) {
      updateData.resellerTier = resellerTier > 0 ? resellerTier : null;
    }

    if (resellerExpiry !== undefined)
      updateData.resellerExpiry = resellerExpiry
        ? new Date(resellerExpiry)
        : null;
    if (resellerPackageId !== undefined)
      updateData.resellerPackageId = resellerPackageId || null;

    // Hash password if provided
    if (password && password.trim() !== "") {
      updateData.password = await hashPassword(password);
    }

    // Check if email is being changed and already exists
    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return NextResponse.json(
          { error: "Email sudah terdaftar" },
          { status: 400 }
        );
      }
    }

    // Update user without running validators (admin has full control)
    // This allows phone to be optional when admin updates
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: false, // Skip validation for admin updates
    }).select("-password");

    const userResponse = {
      _id: updatedUser._id,
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
      isVerified: updatedUser.isVerified,
      googleId: updatedUser.googleId,
      profilePicture: updatedUser.profilePicture,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return NextResponse.json(
      {
        message: "Pengguna berhasil diupdate",
        user: userResponse,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update user error:", error);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
          error: "Akses ditolak. Hanya admin yang dapat menghapus pengguna.",
        },
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Prevent admin from deleting other admins (optional security)
    if (
      existingUser.accessRole === "admin" &&
      existingUser._id.toString() !== decoded.userId
    ) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus admin lain" },
        { status: 403 }
      );
    }

    // Delete user
    await User.findByIdAndDelete(id);

    return NextResponse.json(
      {
        message: "Pengguna berhasil dihapus",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete user error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
