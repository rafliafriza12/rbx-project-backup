import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Gamepass from "@/models/Gamepass";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

// GET - Ambil gamepass berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { id } = params;

    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "ID gamepass tidak valid" },
        { status: 400 }
      );
    }

    const gamepass = await Gamepass.findById(id);

    if (!gamepass) {
      return NextResponse.json(
        { error: "Gamepass tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Gamepass berhasil diambil",
      gamepass,
    });
  } catch (error: any) {
    console.error("Get gamepass error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// PUT - Update gamepass (Admin only)
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

    const { id } = params;

    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "ID gamepass tidak valid" },
        { status: 400 }
      );
    }

    // Get existing gamepass
    const existingGamepass = await Gamepass.findById(id);
    if (!existingGamepass) {
      return NextResponse.json(
        { error: "Gamepass tidak ditemukan" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const gameName = formData.get("gameName") as string;
    const caraPesan = JSON.parse((formData.get("caraPesan") as string) || "[]");
    const features = JSON.parse((formData.get("features") as string) || "[]");
    const items = JSON.parse((formData.get("items") as string) || "[]");
    const gameImage = formData.get("gameImage") as File;

    // Validation
    if (!gameName || !caraPesan.length || !features.length || !items.length) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    let gameImageUrl = existingGamepass.imgUrl;

    // Upload new game image if provided
    if (gameImage && gameImage.size > 0) {
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
      gameImageUrl = gameImageUpload.url;
    }

    // Process items and upload their images
    const processedItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemImageKey = `itemImage_${i}`;
      const itemImage = formData.get(itemImageKey) as File;

      let itemImageUrl = item.imgUrl || ""; // Use existing URL if available

      // Upload new item image if provided
      if (itemImage && itemImage.size > 0) {
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
        itemImageUrl = itemImageUpload.url;
      }

      if (!itemImageUrl) {
        return NextResponse.json(
          { error: `Gambar untuk item ${item.itemName} diperlukan` },
          { status: 400 }
        );
      }

      processedItems.push({
        itemName: item.itemName,
        imgUrl: itemImageUrl,
        price: parseFloat(item.price),
      });
    }

    // Update gamepass
    const updatedGamepass = await Gamepass.findByIdAndUpdate(
      id,
      {
        gameName,
        imgUrl: gameImageUrl,
        caraPesan,
        features,
        item: processedItems,
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: "Gamepass berhasil diupdate",
      gamepass: updatedGamepass,
    });
  } catch (error: any) {
    console.error("Update gamepass error:", error);

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

// DELETE - Hapus gamepass (Admin only)
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

    const { id } = params;

    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "ID gamepass tidak valid" },
        { status: 400 }
      );
    }

    const deletedGamepass = await Gamepass.findByIdAndDelete(id);

    if (!deletedGamepass) {
      return NextResponse.json(
        { error: "Gamepass tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Gamepass berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Delete gamepass error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
