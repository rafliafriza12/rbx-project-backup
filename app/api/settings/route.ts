import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

// GET - Retrieve settings
export async function GET() {
  try {
    await dbConnect();

    const settings = await Settings.getSiteSettings();

    return NextResponse.json({
      message: "Settings berhasil diambil",
      settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Gagal mengambil settings" },
      { status: 500 }
    );
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Get existing settings or create new one
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    // Update fields
    Object.keys(body).forEach((key) => {
      if (body[key] !== undefined) {
        settings[key] = body[key];
      }
    });

    await settings.save();

    return NextResponse.json({
      message: "Settings berhasil diupdate",
      settings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate settings" },
      { status: 500 }
    );
  }
}

// POST - Reset settings to default
export async function POST() {
  try {
    await dbConnect();

    // Delete existing settings
    await Settings.deleteMany({});

    // Create new default settings
    const settings = await Settings.create({});

    return NextResponse.json({
      message: "Settings berhasil direset ke default",
      settings,
    });
  } catch (error) {
    console.error("Error resetting settings:", error);
    return NextResponse.json(
      { error: "Gagal mereset settings" },
      { status: 500 }
    );
  }
}
