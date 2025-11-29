import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

// GET - Get public settings (safe to expose to client)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const settings = await Settings.findOne({});

    if (!settings) {
      return NextResponse.json(
        {
          success: true,
          data: {
            activePaymentGateway: "midtrans",
            siteName: "RBX Store",
            siteDescription: "",
            robuxPricePerUnit: 150,
            minRobuxOrder: 100,
            maxRobuxOrder: 10000,
            emailEnabled: false,
          },
        },
        { status: 200 }
      );
    }

    // Only return safe public settings
    // Payment gateway configs (keys, URLs) are handled by their libs
    // We only expose which gateway is active
    const publicSettings = {
      // Only which gateway is active - configs are in libs
      activePaymentGateway: settings.activePaymentGateway || "midtrans",

      // Public site settings
      siteName: settings.siteName || "RBX Store",
      siteDescription: settings.siteDescription || "",

      // Pricing info (public)
      robuxPricePerUnit: settings.robuxPricePerUnit,
      minRobuxOrder: settings.minRobuxOrder,
      maxRobuxOrder: settings.maxRobuxOrder,

      // Email settings (public)
      emailEnabled: settings.emailEnabled || false,
    };

    return NextResponse.json(
      {
        success: true,
        data: publicSettings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
