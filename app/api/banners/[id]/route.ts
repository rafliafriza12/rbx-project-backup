import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Banner from "@/models/Banner";
import mongoose from "mongoose";

// GET - Fetch single banner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID banner tidak valid",
        },
        { status: 400 }
      );
    }

    const banner = await Banner.findById(id);

    if (!banner) {
      return NextResponse.json(
        {
          success: false,
          error: "Banner tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: banner,
    });
  } catch (error: any) {
    console.error("Error fetching banner:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengambil data banner",
      },
      { status: 500 }
    );
  }
}

// PUT - Update banner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID banner tidak valid",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { imageUrl, link, alt, isActive, order } = body;

    // Validation
    if (!imageUrl || !link || !alt) {
      return NextResponse.json(
        {
          success: false,
          error: "Image URL, link, dan alt text wajib diisi",
        },
        { status: 400 }
      );
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      {
        imageUrl,
        link,
        alt,
        isActive,
        order,
      },
      { new: true, runValidators: true }
    );

    if (!updatedBanner) {
      return NextResponse.json(
        {
          success: false,
          error: "Banner tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedBanner,
      message: "Banner berhasil diupdate",
    });
  } catch (error: any) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengupdate banner",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID banner tidak valid",
        },
        { status: 400 }
      );
    }

    const deletedBanner = await Banner.findByIdAndDelete(id);

    if (!deletedBanner) {
      return NextResponse.json(
        {
          success: false,
          error: "Banner tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Banner berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal menghapus banner",
      },
      { status: 500 }
    );
  }
}
