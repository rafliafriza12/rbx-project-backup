import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Gamepass from "@/models/Gamepass";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

// GET - Ambil gamepass berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

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
      success: true,
      message: "Gamepass berhasil diambil",
      data: gamepass,
    });
  } catch (error: any) {
    console.error("Get gamepass error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan server",
      },
      { status: 500 }
    );
  }
}

// PUT - Update gamepass by ID (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

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
      !gamepassData.item?.length
    ) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // Check homepage limit if trying to set showOnHomepage to true
    if (gamepassData.showOnHomepage) {
      const canAdd = await (Gamepass as any).canAddToHomepage(id);
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

    // Update gamepass
    const updatedGamepass = await Gamepass.findByIdAndUpdate(id, gamepassData, {
      new: true,
      runValidators: true,
    });

    if (!updatedGamepass) {
      return NextResponse.json(
        { error: "Gamepass tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Gamepass berhasil diperbarui",
        data: updatedGamepass,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update gamepass error:", error);

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

// DELETE - Delete gamepass by ID (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

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

    // Delete gamepass
    const deletedGamepass = await Gamepass.findByIdAndDelete(id);

    if (!deletedGamepass) {
      return NextResponse.json(
        { error: "Gamepass tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Gamepass berhasil dihapus",
        data: deletedGamepass,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete gamepass error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan server",
      },
      { status: 500 }
    );
  }
}
