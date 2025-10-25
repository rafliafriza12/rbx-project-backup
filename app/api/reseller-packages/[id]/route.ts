import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ResellerPackage from "@/models/ResellerPackage";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

// GET - Ambil reseller package berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { id } = params;

    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "ID package tidak valid" },
        { status: 400 }
      );
    }

    const resellerPackage = await ResellerPackage.findById(id);

    if (!resellerPackage) {
      return NextResponse.json(
        { error: "Package tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resellerPackage,
    });
  } catch (error: any) {
    console.error("Get reseller package error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan server",
      },
      { status: 500 }
    );
  }
}

// PUT - Update reseller package by ID (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Verify admin token
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

    const user = await User.findById(decoded.userId);
    if (!user || user.accessRole !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Admin diperlukan" },
        { status: 403 }
      );
    }

    const packageData = await request.json();

    // Validation
    if (
      !packageData.name ||
      !packageData.tier ||
      !packageData.price ||
      !packageData.duration ||
      packageData.discount === undefined
    ) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // Check if tier is being changed and if new tier already exists
    const currentPackage = await ResellerPackage.findById(params.id);
    if (currentPackage && currentPackage.tier !== packageData.tier) {
      const existingPackage = await ResellerPackage.findOne({
        tier: packageData.tier,
        _id: { $ne: params.id },
      });
      if (existingPackage) {
        return NextResponse.json(
          { error: `Tier ${packageData.tier} sudah ada` },
          { status: 400 }
        );
      }
    }

    // Update package
    const updatedPackage = await ResellerPackage.findByIdAndUpdate(
      params.id,
      packageData,
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      return NextResponse.json(
        { error: "Package tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Paket reseller berhasil diperbarui",
        data: updatedPackage,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update reseller package error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        {
          success: false,
          error: messages.join(", "),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan server",
      },
      { status: 500 }
    );
  }
}

// DELETE - Hapus reseller package by ID (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Verify admin token
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

    const user = await User.findById(decoded.userId);
    if (!user || user.accessRole !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Admin diperlukan" },
        { status: 403 }
      );
    }

    const deletedPackage = await ResellerPackage.findByIdAndDelete(params.id);

    if (!deletedPackage) {
      return NextResponse.json(
        { error: "Package tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Paket reseller berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Delete reseller package error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan server",
      },
      { status: 500 }
    );
  }
}
