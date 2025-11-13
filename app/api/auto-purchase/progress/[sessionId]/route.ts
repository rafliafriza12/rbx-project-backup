// app/api/auto-purchase/progress/[sessionId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import AutoPurchaseProgress from "@/models/AutoPurchaseProgress";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    await dbConnect();
    const { sessionId } = await params;

    const progress = await AutoPurchaseProgress.findOne({ sessionId });

    if (!progress) {
      return NextResponse.json(
        { success: false, message: "Progress not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("Error fetching auto-purchase progress:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
