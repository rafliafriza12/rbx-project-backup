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
    const gamepasses = await Gamepass.find({}).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: "Gamepass berhasil diambil",
        gamepasses,
      },
      { status: 200 }
    );
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

    const formData = await request.formData();
    const gameName = formData.get("gameName") as string;
    const caraPesan = JSON.parse((formData.get("caraPesan") as string) || "[]");
    const features = JSON.parse((formData.get("features") as string) || "[]");
    const items = JSON.parse((formData.get("items") as string) || "[]");
    const gameImage = formData.get("gameImage") as File;

    // Validation
    if (
      !gameName ||
      !gameImage ||
      !caraPesan.length ||
      !features.length ||
      !items.length
    ) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // Upload game image to cloudinary
    const gameImageUpload = await uploadToCloudinary(
      gameImage,
      "gamepass/games"
    );
    if (!gameImageUpload.success) {
      return NextResponse.json(
        { error: "Gagal mengupload gambar game" },
        { status: 400 }
      );
    }

    // Process items and upload their images
    const processedItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemImageKey = `itemImage_${i}`;
      const itemImage = formData.get(itemImageKey) as File;

      if (!itemImage) {
        return NextResponse.json(
          { error: `Gambar untuk item ${item.itemName} diperlukan` },
          { status: 400 }
        );
      }

      const itemImageUpload = await uploadToCloudinary(
        itemImage,
        "gamepass/items"
      );
      if (!itemImageUpload.success) {
        return NextResponse.json(
          { error: `Gagal mengupload gambar untuk item ${item.itemName}` },
          { status: 400 }
        );
      }

      processedItems.push({
        itemName: item.itemName,
        imgUrl: itemImageUpload.url,
        price: parseFloat(item.price),
      });
    }

    // Create new gamepass
    const newGamepass = new Gamepass({
      gameName,
      imgUrl: gameImageUpload.url,
      caraPesan,
      features,
      item: processedItems,
    });

    await newGamepass.save();

    return NextResponse.json(
      {
        message: "Gamepass berhasil dibuat",
        gamepass: newGamepass,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create gamepass error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
