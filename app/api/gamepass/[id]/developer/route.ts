import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Gamepass from "@/models/Gamepass";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { items } = await request.json();
    const gamepassId = params.id;

    // Update gamepass dengan items yang memiliki developer
    const updatedGamepass = await Gamepass.findByIdAndUpdate(
      gamepassId,
      { items },
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
      message: "Developer gamepass berhasil diperbarui",
      data: updatedGamepass,
    });
  } catch (error) {
    console.error("Update Gamepass Developer Error:", error);
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
