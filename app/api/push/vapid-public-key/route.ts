import { NextRequest, NextResponse } from "next/server";
import { getVapidPublicKey, isWebPushConfigured } from "@/lib/webpush";

/**
 * GET /api/push/vapid-public-key
 * Get VAPID public key for push subscription
 */
export async function GET(request: NextRequest) {
  try {
    // Check if web push is configured
    if (!isWebPushConfigured()) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Web push is not configured. Please set VAPID keys in environment variables." 
        },
        { status: 500 }
      );
    }

    const publicKey = getVapidPublicKey();

    return NextResponse.json({
      success: true,
      publicKey,
    });
  } catch (error: any) {
    console.error("[VAPID Public Key] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
