import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

export async function GET() {
  try {
    await dbConnect();
    const settings = await Settings.getSiteSettings();
    
    return NextResponse.json({
      adminStatusMode: settings.adminStatusMode || "auto",
      operationalHourStart: settings.operationalHourStart || "10:00",
      operationalHourEnd: settings.operationalHourEnd || "21:00",
    });
  } catch (error) {
    console.error("Error fetching admin status:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin status" },
      { status: 500 }
    );
  }
}
