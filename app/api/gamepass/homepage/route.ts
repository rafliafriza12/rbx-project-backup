import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Gamepass from "@/models/Gamepass";

export async function GET() {
  try {
    await dbConnect();

    // Get gamepass that should be shown on homepage (max 3)
    const homepageGamepass = await Gamepass.find({ showOnHomepage: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    return NextResponse.json({
      success: true,
      data: homepageGamepass,
    });
  } catch (error) {
    console.error("Homepage Gamepass API Error:", error);
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
