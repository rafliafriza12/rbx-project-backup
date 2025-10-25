import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ResellerPackage from "@/models/ResellerPackage";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

// GET - Ambil semua reseller packages
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get("admin") === "true";

    // If admin request, verify admin token
    if (isAdmin) {
      const token = request.cookies.get("token")?.value;
      if (!token) {
        return NextResponse.json(
          { error: "Token tidak ditemukan" },
          { status: 401 }
        );
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return NextResponse.json(
          { error: "Token tidak valid" },
          { status: 401 }
        );
      }

      const user = await User.findById(decoded.userId);
      if (!user || user.accessRole !== "admin") {
        return NextResponse.json(
          { error: "Akses ditolak. Admin diperlukan" },
          { status: 403 }
        );
      }

      // Return all packages for admin
      const packages = await ResellerPackage.find({}).sort({ tier: 1 });
      return NextResponse.json({
        success: true,
        data: packages,
      });
    }

    // For public, only return active packages
    const packages = await ResellerPackage.find({ isActive: true }).sort({
      tier: 1,
    });

    return NextResponse.json({
      success: true,
      data: packages,
    });
  } catch (error: any) {
    console.error("Get reseller packages error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Buat reseller package baru (Admin only)
export async function POST(request: NextRequest) {
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

    // Check if tier already exists
    const existingPackage = await ResellerPackage.findOne({
      tier: packageData.tier,
    });
    if (existingPackage) {
      return NextResponse.json(
        { error: `Tier ${packageData.tier} sudah ada` },
        { status: 400 }
      );
    }

    // Create new package
    const newPackage = new ResellerPackage(packageData);
    await newPackage.save();

    return NextResponse.json(
      {
        success: true,
        message: "Paket reseller berhasil dibuat",
        data: newPackage,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create reseller package error:", error);

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
