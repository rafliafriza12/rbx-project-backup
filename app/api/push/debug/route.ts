import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import { authenticateToken } from "@/lib/auth";

/**
 * GET /api/push/debug
 * Debug endpoint to check push subscription status
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Authenticate user
    const user = await authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all subscriptions for this user
    const subscriptions = await PushSubscription.find({
      userId: user._id,
    }).select('-__v');

    return NextResponse.json({
      success: true,
      userId: user._id,
      username: user.username,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.isActive).length,
      subscriptions: subscriptions.map(s => ({
        id: s._id,
        endpoint: s.subscription.endpoint.substring(0, 50) + '...',
        userAgent: s.userAgent,
        isActive: s.isActive,
        createdAt: s.createdAt,
        lastUsed: s.lastUsed,
      })),
    });
  } catch (error: any) {
    console.error("[Push Debug] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
