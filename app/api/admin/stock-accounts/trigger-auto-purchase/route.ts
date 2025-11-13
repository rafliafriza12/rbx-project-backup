import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { autoPurchasePendingRobux } from "@/lib/auto-purchase-robux";

/**
 * Trigger auto-purchase for pending transactions
 * Called after admin confirms they want to run auto-purchase
 */
export async function POST(req: NextRequest) {
  try {
    const { stockAccountId } = await req.json();

    if (!stockAccountId) {
      return NextResponse.json(
        { success: false, message: "Stock account ID required" },
        { status: 400 }
      );
    }

    await connectDB();

    console.log("🚀 Triggering auto-purchase for pending transactions...");
    const autoPurchaseResult = await autoPurchasePendingRobux(stockAccountId);

    return NextResponse.json({
      success: true,
      message: "Auto-purchase started successfully",
      autoPurchase: {
        sessionId: autoPurchaseResult.sessionId,
        message: autoPurchaseResult.message,
      },
    });
  } catch (error: any) {
    console.error("Error triggering auto-purchase:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
