import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

// GET - Get current Midtrans settings
export async function GET() {
  try {
    await dbConnect();

    const settings = await Settings.getSiteSettings();

    return NextResponse.json({
      success: true,
      data: {
        midtransMode: settings.midtransMode,
        hasServerKey: !!settings.midtransServerKey,
        hasClientKey: !!settings.midtransClientKey,
        // Don't return actual keys for security
      },
    });
  } catch (error) {
    console.error("Error getting Midtrans settings:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

// POST - Set Midtrans configuration
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { serverKey, clientKey, mode } = body;

    console.log("Setting Midtrans configuration:", {
      hasServerKey: !!serverKey,
      hasClientKey: !!clientKey,
      mode,
    });

    // Validate input
    if (!serverKey || !clientKey || !mode) {
      return NextResponse.json(
        { error: "Server key, client key, and mode are required" },
        { status: 400 }
      );
    }

    if (!["sandbox", "production"].includes(mode)) {
      return NextResponse.json(
        { error: "Mode must be 'sandbox' or 'production'" },
        { status: 400 }
      );
    }

    // Get or create settings
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    // Update Midtrans settings
    settings.midtransServerKey = serverKey;
    settings.midtransClientKey = clientKey;
    settings.midtransMode = mode;

    await settings.save();

    return NextResponse.json({
      success: true,
      message: "Midtrans settings updated successfully",
      data: {
        mode,
        hasServerKey: !!serverKey,
        hasClientKey: !!clientKey,
      },
    });
  } catch (error) {
    console.error("Error setting Midtrans configuration:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
