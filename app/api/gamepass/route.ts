import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Gamepass from "@/models/Gamepass";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

// GET - Ambil semua gamepass
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
    }

    // Ambil semua gamepass, urutkan berdasarkan tanggal terbaru
    const gamepasses = await Gamepass.find({})
      .select(
        "gameName imgUrl caraPesan features showOnHomepage developer item createdAt updatedAt"
      )
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: gamepasses,
    });
  } catch (error: any) {
    console.error("Get gamepasses error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Buat gamepass baru (Admin only)
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

    const gamepassData = await request.json();

    // Validation
    if (
      !gamepassData.gameName ||
      !gamepassData.imgUrl ||
      !gamepassData.developer ||
      !gamepassData.caraPesan?.length ||
      !gamepassData.features?.length ||
      !gamepassData.item?.length
    ) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // Check homepage limit if trying to set showOnHomepage to true
    if (gamepassData.showOnHomepage) {
      const canAdd = await (Gamepass as any).canAddToHomepage();
      if (!canAdd) {
        return NextResponse.json(
          {
            success: false,
            error: "Maksimal 3 gamepass yang dapat ditampilkan di homepage",
          },
          { status: 400 }
        );
      }
    }

    // Create new gamepass
    const newGamepass = new Gamepass(gamepassData);
    await newGamepass.save();

    return NextResponse.json(
      {
        success: true,
        message: "Gamepass berhasil dibuat",
        data: newGamepass,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create gamepass error:", error);

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
