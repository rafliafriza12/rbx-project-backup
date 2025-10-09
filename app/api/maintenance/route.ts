import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const settings = await Settings.getSiteSettings();

    return NextResponse.json({
      maintenanceMode: settings.maintenanceMode || false,
      maintenanceMessage:
        settings.maintenanceMessage ||
        "Situs sedang dalam pemeliharaan. Silakan coba lagi nanti.",
    });
  } catch (error) {
    console.error("Error fetching maintenance status:", error);
    return NextResponse.json(
      {
        maintenanceMode: false,
        maintenanceMessage: "Situs sedang dalam pemeliharaan.",
      },
      { status: 500 }
    );
  }
}
