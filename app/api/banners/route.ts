import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Banner from "@/models/Banner";

// GET - Fetch all banners
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = {};
    if (activeOnly) {
      query = { isActive: true };
    }

    const banners = await Banner.find(query).sort({ order: 1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: banners,
    });
  } catch (error: any) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengambil data banner",
      },
      { status: 500 }
    );
  }
}

// POST - Create new banner
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

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

    // Create new banner
    const newBanner = await Banner.create({
      imageUrl,
      link,
      alt,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
    });

    return NextResponse.json({
      success: true,
      data: newBanner,
      message: "Banner berhasil ditambahkan",
    });
  } catch (error: any) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal menambahkan banner",
      },
      { status: 500 }
    );
  }
}
