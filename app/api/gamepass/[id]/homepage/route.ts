import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Gamepass from "@/models/Gamepass";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { showOnHomepage } = await request.json();
    const gamepassId = params.id;

    // Check if we can add to homepage
    if (showOnHomepage) {
      const canAdd = await (Gamepass as any).canAddToHomepage(gamepassId);
      if (!canAdd) {
        return NextResponse.json(
          {
            success: false,
            message: "Maksimal 3 gamepass yang dapat ditampilkan di homepage",
          },
          { status: 400 }
        );
      }
    }

    // Update gamepass
    const updatedGamepass = await Gamepass.findByIdAndUpdate(
      gamepassId,
      { showOnHomepage },
      { new: true, runValidators: true }
    );

    if (!updatedGamepass) {
      return NextResponse.json(
        { success: false, message: "Gamepass tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Gamepass ${
        showOnHomepage ? "ditambahkan ke" : "dihapus dari"
      } homepage`,
      data: updatedGamepass,
    });
  } catch (error) {
    console.error("Toggle Homepage Gamepass Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
